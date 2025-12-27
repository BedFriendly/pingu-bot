import { QuizSession, Prisma } from '@prisma/client';
import { IQuizSessionDAO } from '../IQuizSessionDAO';
import { prisma } from '../../prisma';
import { logger } from '../../../utils/logger';

/**
 * QuizSession DAO 구현체
 * quiz_sessions 테이블에 대한 CRUD 작업 구현
 */
export class QuizSessionDAO implements IQuizSessionDAO {
  /**
   * 퀴즈 세션 생성
   */
  async create(data: Prisma.QuizSessionCreateInput): Promise<QuizSession> {
    try {
      const session = await prisma.quizSession.create({ data });
      logger.info('[QuizSessionDAO] 퀴즈 세션 생성됨:', {
        id: session.id,
        guildId: session.guildId,
      });
      return session;
    } catch (error) {
      logger.error('[QuizSessionDAO] create 실패:', { data, error });
      throw error;
    }
  }

  /**
   * ID로 퀴즈 세션 조회
   */
  async findById(id: number): Promise<QuizSession | null> {
    try {
      return await prisma.quizSession.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('[QuizSessionDAO] findById 실패:', { id, error });
      throw error;
    }
  }

  /**
   * 길드의 활성화된 퀴즈 세션 조회 (가장 최근)
   */
  async findActiveByGuildId(guildId: string): Promise<QuizSession | null> {
    try {
      return await prisma.quizSession.findFirst({
        where: { guildId },
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      logger.error('[QuizSessionDAO] findActiveByGuildId 실패:', {
        guildId,
        error,
      });
      throw error;
    }
  }

  /**
   * 퀴즈 세션 삭제 (정답자가 나왔거나 시간 만료 시)
   */
  async delete(id: number): Promise<void> {
    try {
      await prisma.quizSession.delete({
        where: { id },
      });
      logger.info('[QuizSessionDAO] 퀴즈 세션 삭제됨:', { id });
    } catch (error) {
      logger.error('[QuizSessionDAO] delete 실패:', { id, error });
      throw error;
    }
  }

  /**
   * messageId 업데이트
   */
  async updateMessageId(id: number, messageId: string): Promise<QuizSession> {
    try {
      return await prisma.quizSession.update({
        where: { id },
        data: { messageId },
      });
    } catch (error) {
      logger.error('[QuizSessionDAO] updateMessageId 실패:', {
        id,
        messageId,
        error,
      });
      throw error;
    }
  }

  /**
   * 만료된 퀴즈 세션 조회 및 삭제
   */
  async deleteExpiredSessions(timeLimit: number): Promise<number> {
    try {
      const now = new Date();
      const result = await prisma.quizSession.deleteMany({
        where: {
          startedAt: {
            lte: new Date(now.getTime() - timeLimit), // 1시간 이전
          },
        },
      });
      return result.count;
    } catch (error) {
      logger.error('[QuizSessionDAO] deleteExpiredSessions 실패:', { error });
      throw error;
    }
  }

  /**
   * 특정 길드의 퀴즈 세션 기록 조회 (최근 N개)
   */
  async findRecentByGuildId(
    guildId: string,
    limit: number
  ): Promise<QuizSession[]> {
    try {
      return await prisma.quizSession.findMany({
        where: { guildId },
        orderBy: { startedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('[QuizSessionDAO] findRecentByGuildId 실패:', {
        guildId,
        limit,
        error,
      });
      throw error;
    }
  }
}
