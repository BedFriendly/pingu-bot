import { QuizConfig, QuizSession } from '@prisma/client';
import { IQuizRepository } from '../IQuizRepository';
import { IQuizConfigDAO } from '../../database/dao/IQuizConfigDAO';
import { IQuizSessionDAO } from '../../database/dao/IQuizSessionDAO';
import { IUserDAO } from '../../database/dao/IUserDAO';
import { QuizConfigDAO } from '../../database/dao/impl/QuizConfigDAO';
import { QuizSessionDAO } from '../../database/dao/impl/QuizSessionDAO';
import { UserDAO } from '../../database/dao/impl/UserDAO';
import { prisma } from '../../database/prisma';
import { logger } from '../../utils/logger';

/**
 * Quiz Repository 구현체
 * QuizConfig, QuizSession, User DAO를 주입받아 복합 데이터 접근 로직 제공
 * 주의: 비즈니스 로직은 포함하지 않음 (Service 레이어에서 처리)
 */
export class QuizRepository implements IQuizRepository {
  constructor(
    private quizConfigDAO: IQuizConfigDAO = new QuizConfigDAO(),
    private quizSessionDAO: IQuizSessionDAO = new QuizSessionDAO(),
    private userDAO: IUserDAO = new UserDAO()
  ) {}

  /**
   * 길드의 퀴즈 설정 조회
   */
  async findConfig(guildId: string): Promise<QuizConfig | null> {
    return await this.quizConfigDAO.findByGuildId(guildId);
  }

  /**
   * 퀴즈 채널 설정 (신규 생성)
   */
  async createQuizChannel(
    guildId: string,
    channelId: string
  ): Promise<QuizConfig> {
    return await this.quizConfigDAO.create({
      quizChannelId: channelId,
      guild: {
        connect: { guildId },
      },
    });
  }

  /**
   * 퀴즈 채널 업데이트 (기존 설정 수정)
   */
  async updateQuizChannel(
    guildId: string,
    channelId: string
  ): Promise<QuizConfig> {
    return await this.quizConfigDAO.update(guildId, {
      quizChannelId: channelId,
    });
  }

  /**
   * 퀴즈 비활성화 (QuizConfig 삭제)
   */
  async disableQuiz(guildId: string): Promise<void> {
    await this.quizConfigDAO.delete(guildId);
  }

  /**
   * 모든 활성화된 퀴즈 설정 조회
   */
  async findAllActiveConfigs(): Promise<QuizConfig[]> {
    return await this.quizConfigDAO.findAll();
  }

  /**
   * 퀴즈 세션 생성
   */
  async createSession(data: {
    guildId: string;
    channelId: string;
    messageId?: string;
    quizType: string;
    question: string;
    answer: string;
    hint?: string;
    difficulty: number;
    rewardAmount: number;
    timeLimit: number;
  }): Promise<QuizSession> {
    return await this.quizSessionDAO.create({
      channelId: data.channelId,
      messageId: data.messageId,
      quizType: data.quizType,
      question: data.question,
      answer: data.answer,
      hint: data.hint,
      difficulty: data.difficulty,
      rewardAmount: data.rewardAmount,
      timeLimit: data.timeLimit,
      quizConfig: {
        connect: { guildId: data.guildId },
      },
    });
  }

  /**
   * 퀴즈 세션 조회
   */
  async findSessionById(id: number): Promise<QuizSession | null> {
    return await this.quizSessionDAO.findById(id);
  }

  /**
   * 길드의 활성화된 퀴즈 세션 조회
   */
  async findActiveSession(guildId: string): Promise<QuizSession | null> {
    return await this.quizSessionDAO.findActiveByGuildId(guildId);
  }

  /**
   * 퀴즈 정답 처리 (트랜잭션)
   * - User의 코인을 증가시키고
   * - QuizSession을 삭제
   * @returns 지급된 코인 금액
   */
  async completeQuiz(
    quizSessionId: number,
    userId: string,
    username: string
  ): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      // 1. 퀴즈 세션 조회
      const session = await tx.quizSession.findUnique({
        where: { id: quizSessionId },
      });

      if (!session) {
        throw new Error('QuizSession not found');
      }

      // 2. User 조회 또는 생성
      let user = await tx.user.findUnique({
        where: { userId },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            userId,
            username,
          },
        });
      }

      // 3. User 코인 지급
      await tx.user.update({
        where: { userId },
        data: {
          coins: { increment: session.rewardAmount },
        },
      });

      // 4. QuizSession 삭제
      await tx.quizSession.delete({
        where: { id: quizSessionId },
      });

      logger.info(
        `퀴즈 정답 처리 완료: Session ${quizSessionId}, User ${userId}, Coins +${session.rewardAmount}`
      );

      return session.rewardAmount;
    });
  }

  /**
   * 퀴즈 세션 삭제
   */
  async deleteSession(id: number): Promise<void> {
    await this.quizSessionDAO.delete(id);
  }

  /**
   * 만료된 퀴즈 세션 정리 (배치)
   */
  async cleanupExpiredSessions(timeLimit: number): Promise<number> {
    return await this.quizSessionDAO.deleteExpiredSessions(timeLimit);
  }

  /**
   * messageId 업데이트
   */
  async updateSessionMessageId(
    id: number,
    messageId: string
  ): Promise<QuizSession> {
    return await this.quizSessionDAO.updateMessageId(id, messageId);
  }
}
