import { QuizConfig, Prisma } from '@prisma/client';
import { IQuizConfigDAO } from '../IQuizConfigDAO';
import { prisma } from '../../prisma';
import { logger } from '../../../utils/logger';

/**
 * QuizConfig DAO 구현체
 * quiz_configs 테이블에 대한 CRUD 작업 구현
 */
export class QuizConfigDAO implements IQuizConfigDAO {
  /**
   * 길드 ID로 퀴즈 설정 조회
   */
  async findByGuildId(guildId: string): Promise<QuizConfig | null> {
    try {
      return await prisma.quizConfig.findUnique({
        where: { guildId },
      });
    } catch (error) {
      logger.error('[QuizConfigDAO] findByGuildId 실패:', { guildId, error });
      throw error;
    }
  }

  /**
   * 퀴즈 설정 생성
   */
  async create(data: Prisma.QuizConfigCreateInput): Promise<QuizConfig> {
    try {
      const config = await prisma.quizConfig.create({ data });
      logger.info('[QuizConfigDAO] 퀴즈 설정 생성됨:', {
        guildId: config.guildId,
      });
      return config;
    } catch (error) {
      logger.error('[QuizConfigDAO] create 실패:', { data, error });
      throw error;
    }
  }

  /**
   * 퀴즈 설정 업데이트 (채널 변경)
   */
  async update(
    guildId: string,
    data: Prisma.QuizConfigUpdateInput
  ): Promise<QuizConfig> {
    try {
      return await prisma.quizConfig.update({
        where: { guildId },
        data,
      });
    } catch (error) {
      logger.error('[QuizConfigDAO] update 실패:', { guildId, data, error });
      throw error;
    }
  }

  /**
   * 퀴즈 설정 삭제 (비활성화)
   */
  async delete(guildId: string): Promise<void> {
    try {
      await prisma.quizConfig.delete({
        where: { guildId },
      });
      logger.info('[QuizConfigDAO] 퀴즈 설정 삭제됨:', { guildId });
    } catch (error) {
      logger.error('[QuizConfigDAO] delete 실패:', { guildId, error });
      throw error;
    }
  }

  /**
   * 모든 퀴즈 설정 조회 (활성화된 모든 길드)
   */
  async findAll(): Promise<QuizConfig[]> {
    try {
      return await prisma.quizConfig.findMany();
    } catch (error) {
      logger.error('[QuizConfigDAO] findAll 실패:', { error });
      throw error;
    }
  }
}
