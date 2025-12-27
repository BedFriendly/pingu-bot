import cron, { ScheduledTask } from 'node-cron';
import { QuizService } from '../service/quiz/quiz.service';
import { IQuizRepository } from '../repository/IQuizRepository';
import { QuizRepository } from '../repository/impl/QuizRepository';
import { QuizCreateReqDto } from '../service/quiz/dto/request/QuizCreateReqDto';
import { QuizAnswerSubmitReqDto } from '../service/quiz/dto/request/QuizAnswerSubmitReqDto';
import {
  QuizEmbed,
  QuizCorrectEmbed,
  QuizExpiredEmbed,
} from '../embed/quiz/QuizEmbed';
import { logger } from '../utils/logger';
import { Client, TextChannel } from 'discord.js';
import { config } from '../config/config';

/**
 * 퀴즈 스케줄러
 * Cron 기반 자동 퀴즈 생성 및 전송
 */
export class QuizScheduler {
  private quizService: QuizService;
  private quizRepository: IQuizRepository;
  private mainTask: ScheduledTask | null = null;
  private cleanupTask: ScheduledTask | null = null;

  constructor(
    private client: Client,
    quizService?: QuizService,
    quizRepository?: IQuizRepository
  ) {
    this.quizService = quizService || new QuizService();
    this.quizRepository = quizRepository || new QuizRepository();
  }

  /**
   * 스케줄러 초기화
   * - 단일 Cron Job 등록 (모든 길드에 대해)
   * - 만료된 퀴즈 정리 작업 등록
   */
  async initialize(): Promise<void> {
    logger.info('QuizScheduler 초기화 중...');

    // 만료된 퀴즈 정리 작업 (5분마다)
    // this.scheduleCleanup();

    // 메인 퀴즈 생성 작업 스케줄링
    this.scheduleMainQuizJob();

    logger.info('QuizScheduler 초기화 완료');
  }

  /**
   * 메인 퀴즈 생성 작업 스케줄링
   * 환경 변수에서 가져온 Cron 표현식 사용
   */
  private scheduleMainQuizJob(): void {
    const cronExpression = config.quiz.generationCron;

    // Cron 표현식 검증
    if (!cron.validate(cronExpression)) {
      logger.error(`유효하지 않은 Cron 표현식: ${cronExpression}`);
      return;
    }

    // Cron 작업 생성
    this.mainTask = cron.schedule(cronExpression, async () => {
      await this.executeQuizJobForAllGuilds();
    });

    logger.info(`메인 퀴즈 작업 스케줄링 완료: ${cronExpression}`);
  }

  /**
   * 모든 활성화된 길드에 대해 퀴즈 생성
   */
  private async executeQuizJobForAllGuilds(): Promise<void> {
    try {
      logger.info('퀴즈 생성 작업 시작 (모든 길드)');

      // 활성화된 모든 QuizConfig 조회
      const configs = await this.quizRepository.findAllActiveConfigs();

      if (configs.length === 0) {
        logger.info('활성화된 퀴즈 설정이 없습니다.');
        return;
      }

      // 각 길드에 대해 퀴즈 생성
      Promise.allSettled(
        configs
          .map((config) => config.guildId)
          .map((guildId) => this.executeQuizJobForGuild(guildId))
      );

      logger.info(`퀴즈 생성 작업 완료: ${configs.length}개 길드`);
    } catch (error) {
      logger.error('퀴즈 생성 작업 실패:', error);
    }
  }

  /**
   * 특정 길드에 대해 퀴즈 생성
   */
  private async executeQuizJobForGuild(guildId: string): Promise<void> {
    try {
      logger.info(`퀴즈 생성 시작: Guild ${guildId}`);

      // 1. 퀴즈 생성
      const reqDto = new QuizCreateReqDto({ guildId });
      const quizRes = await this.quizService.createQuiz(reqDto);

      // 2. Discord 채널에 전송
      const channel = (await this.client.channels.fetch(
        quizRes.channelId
      )) as TextChannel;

      if (!channel) {
        logger.error(`퀴즈 채널을 찾을 수 없음: ${quizRes.channelId}`);
        return;
      }

      const embed = QuizEmbed.create({
        question: quizRes.session.question,
        difficulty: quizRes.session.difficulty,
        hint: quizRes.session.hint,
        timeLimit: quizRes.session.timeLimit,
        rewardAmount: quizRes.session.rewardAmount,
      });

      const message = await channel.send({ embeds: [embed] });

      // 3. QuizSession에 messageId 업데이트
      await this.quizRepository.updateSessionMessageId(
        quizRes.session.id,
        message.id
      );

      // 4. MessageCollector 시작
      await this.startQuizCollector(
        channel,
        quizRes.session.id,
        quizRes.session.timeLimit,
        quizRes.session.answer
      );

      logger.info(
        `퀴즈 전송 완료: Guild ${guildId}, Session ${quizRes.session.id}`
      );
    } catch (error) {
      logger.error(`퀴즈 생성 실패: Guild ${guildId}`, error);
    }
  }

  /**
   * MessageCollector 시작
   */
  private async startQuizCollector(
    channel: TextChannel,
    quizSessionId: number,
    timeLimit: number,
    correctAnswer: string
  ): Promise<void> {
    const collector = channel.createMessageCollector({
      filter: (m) => !m.author.bot,
      time: timeLimit * 1000,
    });

    collector.on('collect', async (message) => {
      try {
        const reqDto = new QuizAnswerSubmitReqDto({
          quizSessionId,
          userId: message.author.id,
          username: message.author.username,
          answer: message.content.trim(),
        });

        const result = await this.quizService.submitAnswer(reqDto);

        if (result.isCorrect) {
          collector.stop('correct_answer');
          await message.react('✅');

          const embed = QuizCorrectEmbed.create({
            winner: message.author.username,
            answer: result.correctAnswer!,
            coinsEarned: result.coinsEarned,
          });

          await channel.send({ embeds: [embed] });
        } else {
          await message.react('❌');
        }
      } catch (error) {
        if ((error as Error).message.includes('찾을 수 없습니다')) {
          collector.stop('quiz_ended');
        } else {
          logger.error('정답 제출 처리 실패:', error);
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        try {
          const embed = QuizExpiredEmbed.create({ answer: correctAnswer });
          await channel.send({ embeds: [embed] });
          await this.quizService.expireSession(quizSessionId);
        } catch (error) {
          logger.error('퀴즈 만료 처리 실패:', error);
        }
      }
    });
  }

  /**
   * 길드 설정 변경 시 호출 (명령어에서 사용)
   */
  async refreshGuildConfig(guildId: string): Promise<void> {
    logger.info(`QuizScheduler: 길드 설정 새로고침 - ${guildId}`);
    // 단일 Cron Job 방식이므로 별도 작업 불필요
    // 다음 스케줄 실행 시 자동으로 새로운 설정 반영됨
  }

  /**
   * 만료된 퀴즈 정리 작업 스케줄링
   */
  private scheduleCleanup(): void {
    // 5분마다 실행
    this.cleanupTask = cron.schedule('*/5 * * * *', async () => {
      try {
        const deletedCount = await this.quizRepository.cleanupExpiredSessions(
          config.quiz.timeLimit
        );
        if (deletedCount > 0) {
          logger.info(`만료된 퀴즈 세션 정리: ${deletedCount}개`);
        }
      } catch (error) {
        logger.error('퀴즈 정리 작업 실패:', error);
      }
    });

    logger.info('퀴즈 정리 작업 스케줄링 완료 (5분마다)');
  }

  /**
   * 스케줄러 종료
   */
  shutdown(): void {
    logger.info('QuizScheduler 종료 중...');

    // 메인 작업 중지
    if (this.mainTask) {
      this.mainTask.stop();
      this.mainTask = null;
    }

    // 정리 작업 중지
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = null;
    }

    logger.info('QuizScheduler 종료 완료');
  }
}
