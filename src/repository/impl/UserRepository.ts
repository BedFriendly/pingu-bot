import { User } from '@prisma/client';
import { IUserRepository } from '../IUserRepository';
import { IUserDAO } from '../../database/dao/IUserDAO';
import { UserDAO } from '../../database/dao/impl/UserDAO';
import { prisma } from '../../database/prisma';
import { logger } from '../../utils/logger';

/**
 * User Repository 구현체
 * User DAO를 주입받아 복합 데이터 접근 로직 제공
 * 주의: 비즈니스 로직은 포함하지 않음 (Service 레이어에서 처리)
 */
export class UserRepository implements IUserRepository {
  constructor(private userDAO: IUserDAO = new UserDAO()) {}

  /**
   * ID로 사용자 조회
   */
  async findById(userId: string): Promise<User | null> {
    return await this.userDAO.findById(userId);
  }

  /**
   * 사용자가 존재하지 않으면 생성, 존재하면 반환
   */
  async findOrCreate(userId: string, username: string): Promise<User> {
    let user = await this.userDAO.findById(userId);
    if (!user) {
      user = await this.userDAO.create({ userId, username });
    }
    return user;
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(
    userId: string,
    data: {
      username?: string;
      coins?: number;
      experience?: number;
      level?: number;
      totalWins?: number;
      totalGames?: number;
      lastDaily?: Date;
    }
  ): Promise<User> {
    return await this.userDAO.update(userId, data);
  }

  /**
   * 코인 전송 (트랜잭션)
   * 주의: 잔액 검증은 Service 레이어에서 수행
   */
  async transferCoins(
    fromId: string,
    toId: string,
    amount: number
  ): Promise<{ sender: User; receiver: User }> {
    try {
      // Prisma 트랜잭션 사용
      const result = await prisma.$transaction(async (tx) => {
        // 보내는 사람 코인 차감
        const sender = await tx.user.update({
          where: { userId: fromId },
          data: {
            coins: {
              decrement: amount,
            },
          },
        });

        // 받는 사람 코인 증가
        const receiver = await tx.user.update({
          where: { userId: toId },
          data: {
            coins: {
              increment: amount,
            },
          },
        });

        return { sender, receiver };
      });

      logger.info('코인 전송 완료:', { fromId, toId, amount });
      return result;
    } catch (error) {
      logger.error('코인 전송 실패:', { fromId, toId, amount, error });
      throw error;
    }
  }

  /**
   * 일일 보상 시간 업데이트
   */
  async updateLastDaily(userId: string): Promise<User> {
    return await this.userDAO.update(userId, {
      lastDaily: new Date(),
    });
  }

  /**
   * 코인 기준 리더보드 조회
   */
  async getLeaderboardByCoins(limit: number): Promise<User[]> {
    return await this.userDAO.getTopByCoins(limit);
  }

  /**
   * 레벨 기준 리더보드 조회
   */
  async getLeaderboardByLevel(limit: number): Promise<User[]> {
    return await this.userDAO.getTopByLevel(limit);
  }

  /**
   * 승수 기준 리더보드 조회
   */
  async getLeaderboardByWins(limit: number): Promise<User[]> {
    return await this.userDAO.getTopByWins(limit);
  }
}
