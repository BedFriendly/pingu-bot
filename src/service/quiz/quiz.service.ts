import { QuizConfig } from '@prisma/client';
import { IQuizRepository } from '../../repository/IQuizRepository';
import { QuizRepository } from '../../repository/impl/QuizRepository';
import { QuizGeneratorFactory } from './generator/QuizGeneratorFactory';
import { QuizCreateReqDto } from './dto/request/QuizCreateReqDto';
import { QuizAnswerSubmitReqDto } from './dto/request/QuizAnswerSubmitReqDto';
import { QuizChannelSetReqDto } from './dto/request/QuizChannelSetReqDto';
import { QuizCreateResDto } from './dto/response/QuizCreateResDto';
import { QuizAnswerSubmitResDto } from './dto/response/QuizAnswerSubmitResDto';
import { QuizChannelSetResDto } from './dto/response/QuizChannelSetResDto';
import {
  QuizNotFoundError,
  QuizAlreadyActiveError,
  QuizChannelNotSetError,
} from '../../errors/game/quiz';
import { logger } from '../../utils/logger';
import { config } from '../../config/config';
import { QuizType } from '../../types/quiz';

/**
 * Quiz Service
 * 퀴즈 생성, 검증, 보상 지급 등 비즈니스 로직 처리
 */
export class QuizService {
  private readonly DEFAULT_DIFFICULTY = 3; // 기본 난이도
  private readonly DEFAULT_REWARD_AMOUNT = 100; // 기본 보상 (PC)

  constructor(private quizRepository: IQuizRepository = new QuizRepository()) {}

  /**
   * 새 퀴즈 생성
   */
  async createQuiz(reqDto: QuizCreateReqDto): Promise<QuizCreateResDto> {
    const { guildId, quizType } = reqDto;

    // 1. 퀴즈 설정 조회
    const quizConfig = await this.quizRepository.findConfig(guildId);

    // 비즈니스 로직: 퀴즈 설정이 없거나 채널이 설정되지 않음
    if (!quizConfig || !quizConfig.quizChannelId) {
      throw new QuizChannelNotSetError('퀴즈 채널이 설정되지 않았습니다.');
    }

    // 비즈니스 로직: 이미 활성화된 퀴즈가 있는지 확인
    const activeSession = await this.quizRepository.findActiveSession(guildId);
    if (activeSession) {
      throw new QuizAlreadyActiveError('이미 진행 중인 퀴즈가 있습니다.');
    }

    // 2. 퀴즈 생성
    const generator = quizType
      ? QuizGeneratorFactory.getGenerator(quizType)
      : QuizGeneratorFactory.getRandomGenerator();

    const quizQuestion = await generator.generate(this.DEFAULT_DIFFICULTY);

    // 3. 퀴즈 세션 생성
    const session = await this.quizRepository.createSession({
      guildId,
      channelId: quizConfig.quizChannelId,
      quizType: quizQuestion.type,
      question: quizQuestion.question,
      answer: quizQuestion.answer,
      hint: quizQuestion.hint,
      difficulty: quizQuestion.difficulty,
      rewardAmount: this.DEFAULT_REWARD_AMOUNT,
      timeLimit: Math.floor(config.quiz.timeLimit / 1000), // 밀리초 -> 초
    });

    logger.info(
      `퀴즈 생성 완료: Guild ${guildId}, Session ${session.id}, Type ${quizQuestion.type}`
    );

    // Response DTO 생성
    return new QuizCreateResDto({
      session: {
        id: session.id,
        quizType: session.quizType,
        question: session.question,
        hint: session.hint ?? undefined,
        difficulty: session.difficulty,
        timeLimit: session.timeLimit,
        rewardAmount: session.rewardAmount,
        answer: session.answer,
      },
      channelId: quizConfig.quizChannelId,
    });
  }

  /**
   * 정답 제출 및 검증
   */
  async submitAnswer(
    reqDto: QuizAnswerSubmitReqDto
  ): Promise<QuizAnswerSubmitResDto> {
    const { quizSessionId, userId, username, answer } = reqDto;

    // 1. 퀴즈 세션 조회
    const session = await this.quizRepository.findSessionById(quizSessionId);
    if (!session) {
      throw new QuizNotFoundError('퀴즈 세션을 찾을 수 없습니다.');
    }

    // 비즈니스 로직: 제한 시간 확인
    const now = new Date();
    const elapsed = (now.getTime() - session.startedAt.getTime()) / 1000;
    if (elapsed > session.timeLimit) {
      // 만료된 퀴즈 삭제
      await this.quizRepository.deleteSession(quizSessionId);
      throw new QuizNotFoundError('퀴즈 제한 시간이 초과되었습니다.');
    }

    // 2. 정답 검증
    const generator = QuizGeneratorFactory.getGenerator(
      session.quizType as QuizType
    );
    const isCorrect = generator.validateAnswer(answer, session.answer);

    if (!isCorrect) {
      // 오답 - 아무 처리도 하지 않음
      return new QuizAnswerSubmitResDto({
        isCorrect: false,
        coinsEarned: 0,
      });
    }

    // 3. 정답 처리 (트랜잭션: 코인 지급 + 세션 삭제)
    const coinsEarned = await this.quizRepository.completeQuiz(
      quizSessionId,
      userId,
      username
    );

    logger.info(
      `퀴즈 정답: Session ${quizSessionId}, User ${userId}, Coins ${coinsEarned}`
    );

    // Response DTO 생성
    return new QuizAnswerSubmitResDto({
      isCorrect: true,
      correctAnswer: session.answer,
      coinsEarned,
    });
  }

  /**
   * 퀴즈 채널 설정
   */
  async setQuizChannel(
    reqDto: QuizChannelSetReqDto
  ): Promise<QuizChannelSetResDto> {
    const { guildId, channelId } = reqDto;

    // 기존 설정 확인
    const existingConfig = await this.quizRepository.findConfig(guildId);

    let configResult;
    if (existingConfig) {
      // 업데이트
      configResult = await this.quizRepository.updateQuizChannel(
        guildId,
        channelId
      );
    } else {
      // 새로 생성
      configResult = await this.quizRepository.createQuizChannel(
        guildId,
        channelId
      );
    }

    logger.info(`퀴즈 채널 설정: Guild ${guildId}, Channel ${channelId}`);

    return new QuizChannelSetResDto({
      guildId: configResult.guildId,
      quizChannelId: configResult.quizChannelId,
    });
  }

  /**
   * 퀴즈 비활성화
   */
  async disableQuiz(guildId: string): Promise<void> {
    await this.quizRepository.disableQuiz(guildId);
    logger.info(`퀴즈 비활성화: Guild ${guildId}`);
  }

  /**
   * 퀴즈 설정 조회
   */
  async getConfig(guildId: string): Promise<QuizConfig | null> {
    return await this.quizRepository.findConfig(guildId);
  }

  /**
   * 퀴즈 세션 만료 처리
   */
  async expireSession(quizSessionId: number): Promise<void> {
    const session = await this.quizRepository.findSessionById(quizSessionId);
    if (session) {
      await this.quizRepository.deleteSession(quizSessionId);
      logger.info(`퀴즈 만료: Session ${quizSessionId}`);
    }
  }
}
