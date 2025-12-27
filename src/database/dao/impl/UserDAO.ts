import { User, Prisma } from '@prisma/client';
import { IUserDAO } from '../IUserDAO';
import { prisma } from '../../prisma';
import { logger } from '../../../utils/logger';

/**
 * User DAO 구현체
 * users 테이블에 대한 CRUD 작업 구현
 */
export class UserDAO implements IUserDAO {
  /**
   * ID로 사용자 조회
   */
  async findById(userId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { userId },
      });
    } catch (error) {
      logger.error('사용자 조회 실패:', { userId, error });
      throw error;
    }
  }

  /**
   * 여러 사용자 조회
   */
  async findMany(userIds: string[]): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        where: { userId: { in: userIds } },
      });
    } catch (error) {
      logger.error('여러 사용자 조회 실패:', { userIds, error });
      throw error;
    }
  }

  /**
   * 모든 사용자 조회
   */
  async findAll(): Promise<User[]> {
    try {
      return await prisma.user.findMany();
    } catch (error) {
      logger.error('모든 사용자 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 새 사용자 생성
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const user = await prisma.user.create({ data });
      logger.info('새 사용자 생성됨:', { userId: user.userId });
      return user;
    } catch (error) {
      logger.error('사용자 생성 실패:', { data, error });
      throw error;
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  async update(userId: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await prisma.user.update({
        where: { userId },
        data,
      });
    } catch (error) {
      logger.error('사용자 업데이트 실패:', { userId, data, error });
      throw error;
    }
  }

  /**
   * 사용자 삭제
   */
  async delete(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { userId },
      });
      logger.info('사용자 삭제됨:', { userId });
    } catch (error) {
      logger.error('사용자 삭제 실패:', { userId, error });
      throw error;
    }
  }

  /**
   * 코인 증감 (원자적 연산)
   */
  async incrementCoins(userId: string, amount: number): Promise<User> {
    try {
      return await prisma.user.update({
        where: { userId },
        data: {
          coins: {
            increment: amount,
          },
        },
      });
    } catch (error) {
      logger.error('코인 증감 실패:', { userId, amount, error });
      throw error;
    }
  }

  /**
   * 경험치 증감 (원자적 연산)
   */
  async incrementExperience(userId: string, amount: number): Promise<User> {
    try {
      return await prisma.user.update({
        where: { userId },
        data: {
          experience: {
            increment: amount,
          },
        },
      });
    } catch (error) {
      logger.error('경험치 증감 실패:', { userId, amount, error });
      throw error;
    }
  }

  /**
   * 코인 기준 리더보드 조회
   */
  async getTopByCoins(limit: number): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { coins: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('코인 리더보드 조회 실패:', { limit, error });
      throw error;
    }
  }

  /**
   * 레벨 기준 리더보드 조회
   */
  async getTopByLevel(limit: number): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: [{ level: 'desc' }, { experience: 'desc' }],
        take: limit,
      });
    } catch (error) {
      logger.error('레벨 리더보드 조회 실패:', { limit, error });
      throw error;
    }
  }

  /**
   * 승수 기준 리더보드 조회
   */
  async getTopByWins(limit: number): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { totalWins: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('승수 리더보드 조회 실패:', { limit, error });
      throw error;
    }
  }
}
