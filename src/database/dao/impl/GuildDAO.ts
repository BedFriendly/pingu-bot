import { Guild, Prisma } from '@prisma/client';
import { IGuildDAO } from '../IGuildDAO';
import { prisma } from '../../prisma';
import { logger } from '../../../utils/logger';

/**
 * Guild DAO 구현체
 * guilds 테이블에 대한 CRUD 작업 구현
 */
export class GuildDAO implements IGuildDAO {
  /**
   * ID로 길드 조회
   */
  async findById(guildId: string): Promise<Guild | null> {
    try {
      return await prisma.guild.findUnique({
        where: { guildId },
      });
    } catch (error) {
      logger.error('길드 조회 실패:', { guildId, error });
      throw error;
    }
  }

  /**
   * 모든 길드 조회
   */
  async findAll(): Promise<Guild[]> {
    try {
      return await prisma.guild.findMany();
    } catch (error) {
      logger.error('모든 길드 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 새 길드 생성
   */
  async create(data: Prisma.GuildCreateInput): Promise<Guild> {
    try {
      const guild = await prisma.guild.create({ data });
      logger.info('새 길드 생성됨:', { guildId: guild.guildId });
      return guild;
    } catch (error) {
      logger.error('길드 생성 실패:', { data, error });
      throw error;
    }
  }

  /**
   * 길드 정보 업데이트
   */
  async update(guildId: string, data: Prisma.GuildUpdateInput): Promise<Guild> {
    try {
      return await prisma.guild.update({
        where: { guildId },
        data,
      });
    } catch (error) {
      logger.error('길드 업데이트 실패:', { guildId, data, error });
      throw error;
    }
  }

  /**
   * 길드 삭제
   */
  async delete(guildId: string): Promise<void> {
    try {
      await prisma.guild.delete({
        where: { guildId },
      });
      logger.info('길드 삭제됨:', { guildId });
    } catch (error) {
      logger.error('길드 삭제 실패:', { guildId, error });
      throw error;
    }
  }
}
