import { GameStat, Prisma } from '@prisma/client';
import { IGameStatDAO } from '../IGameStatDAO';
import { prisma } from '../../prisma';
import { logger } from '../../../utils/logger';

/**
 * GameStat DAO 구현체
 * game_stats 테이블에 대한 CRUD 작업 구현
 */
export class GameStatDAO implements IGameStatDAO {
  /**
   * ID로 게임 통계 조회
   */
  async findById(id: number): Promise<GameStat | null> {
    try {
      return await prisma.gameStat.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('게임 통계 조회 실패:', { id, error });
      throw error;
    }
  }

  /**
   * 사용자의 모든 게임 통계 조회
   */
  async findByUserId(userId: string): Promise<GameStat[]> {
    try {
      return await prisma.gameStat.findMany({
        where: { userId },
        orderBy: { playedAt: 'desc' },
      });
    } catch (error) {
      logger.error('사용자 게임 통계 조회 실패:', { userId, error });
      throw error;
    }
  }

  /**
   * 특정 게임 타입의 통계 조회
   */
  async findByUserIdAndGameType(
    userId: string,
    gameType: string
  ): Promise<GameStat[]> {
    try {
      return await prisma.gameStat.findMany({
        where: {
          userId,
          gameType,
        },
        orderBy: { playedAt: 'desc' },
      });
    } catch (error) {
      logger.error('게임 타입별 통계 조회 실패:', {
        userId,
        gameType,
        error,
      });
      throw error;
    }
  }

  /**
   * 게임 통계 생성
   */
  async create(data: Prisma.GameStatCreateInput): Promise<GameStat> {
    try {
      const gameStat = await prisma.gameStat.create({ data });
      logger.info('게임 통계 생성됨:', { id: gameStat.id });
      return gameStat;
    } catch (error) {
      logger.error('게임 통계 생성 실패:', { data, error });
      throw error;
    }
  }

  /**
   * 게임 통계 삭제
   */
  async delete(id: number): Promise<void> {
    try {
      await prisma.gameStat.delete({
        where: { id },
      });
      logger.info('게임 통계 삭제됨:', { id });
    } catch (error) {
      logger.error('게임 통계 삭제 실패:', { id, error });
      throw error;
    }
  }

  /**
   * 사용자의 모든 게임 통계 삭제
   */
  async deleteByUserId(userId: string): Promise<void> {
    try {
      await prisma.gameStat.deleteMany({
        where: { userId },
      });
      logger.info('사용자 게임 통계 삭제됨:', { userId });
    } catch (error) {
      logger.error('사용자 게임 통계 삭제 실패:', { userId, error });
      throw error;
    }
  }
}
