import { db } from '../connection';
import { User } from '../../types/database';
import { logger } from '../../utils/logger';

/**
 * User 모델
 * 사용자 데이터에 대한 CRUD 작업 제공
 */
export class UserModel {
  /**
   * ID로 사용자 조회
   * @param userId 사용자 디스코드 ID
   * @returns User 객체 또는 null
   */
  static async findById(userId: string): Promise<User | null> {
    try {
      const result = await db.query<User>(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('사용자 조회 실패:', { userId, error });
      throw error;
    }
  }

  /**
   * 새 사용자 생성
   * @param userId 사용자 디스코드 ID
   * @param username 사용자 이름
   * @returns 생성된 User 객체
   */
  static async create(userId: string, username: string): Promise<User> {
    try {
      const result = await db.query<User>(
        `INSERT INTO users (user_id, username)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, username]
      );
      logger.info('새 사용자 생성됨:', { userId, username });
      return result.rows[0];
    } catch (error) {
      logger.error('사용자 생성 실패:', { userId, username, error });
      throw error;
    }
  }

  /**
   * 사용자가 존재하지 않으면 생성, 존재하면 반환
   * @param userId 사용자 디스코드 ID
   * @param username 사용자 이름
   * @returns User 객체
   */
  static async findOrCreate(userId: string, username: string): Promise<User> {
    let user = await this.findById(userId);
    if (!user) {
      user = await this.create(userId, username);
    }
    return user;
  }

  /**
   * 사용자 정보 업데이트
   * @param userId 사용자 디스코드 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 User 객체
   */
  static async update(
    userId: string,
    data: Partial<Omit<User, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<User> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 동적으로 업데이트 쿼리 생성
      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      });

      values.push(userId);

      const result = await db.query<User>(
        `UPDATE users
         SET ${fields.join(', ')}
         WHERE user_id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      logger.error('사용자 업데이트 실패:', { userId, data, error });
      throw error;
    }
  }

  /**
   * 코인 추가
   * @param userId 사용자 디스코드 ID
   * @param amount 추가할 코인 양 (음수일 경우 차감)
   * @returns 업데이트된 User 객체
   */
  static async addCoins(userId: string, amount: number): Promise<User> {
    try {
      const result = await db.query<User>(
        `UPDATE users
         SET coins = coins + $1
         WHERE user_id = $2
         RETURNING *`,
        [amount, userId]
      );

      if (result.rows.length === 0) {
        throw new Error(`사용자를 찾을 수 없습니다: ${userId}`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('코인 추가 실패:', { userId, amount, error });
      throw error;
    }
  }

  /**
   * 경험치 추가 및 레벨업 처리
   * @param userId 사용자 디스코드 ID
   * @param xp 추가할 경험치
   * @returns { user: User, leveledUp: boolean, newLevel?: number }
   */
  static async addExperience(
    userId: string,
    xp: number
  ): Promise<{ user: User; leveledUp: boolean; newLevel?: number }> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error(`사용자를 찾을 수 없습니다: ${userId}`);
      }

      const newXp = user.experience + xp;
      let newLevel = user.level;
      let leveledUp = false;

      // 레벨업 계산: XP = 100 * level^1.5
      while (newXp >= 100 * Math.pow(newLevel, 1.5)) {
        newLevel++;
        leveledUp = true;
      }

      // 레벨업 보상: level × 100 PC
      const coinReward = leveledUp ? (newLevel - user.level) * 100 : 0;

      const result = await db.query<User>(
        `UPDATE users
         SET experience = $1, level = $2, coins = coins + $3
         WHERE user_id = $4
         RETURNING *`,
        [newXp, newLevel, coinReward, userId]
      );

      return {
        user: result.rows[0],
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
      };
    } catch (error) {
      logger.error('경험치 추가 실패:', { userId, xp, error });
      throw error;
    }
  }

  /**
   * 일일 보상 업데이트
   * @param userId 사용자 디스코드 ID
   * @returns 업데이트된 User 객체
   */
  static async updateDaily(userId: string): Promise<User> {
    try {
      const result = await db.query<User>(
        `UPDATE users
         SET last_daily = NOW()
         WHERE user_id = $1
         RETURNING *`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('일일 보상 업데이트 실패:', { userId, error });
      throw error;
    }
  }

  /**
   * 리더보드 조회 (코인 기준)
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  static async getLeaderboardByCoins(limit: number = 10): Promise<User[]> {
    try {
      const result = await db.query<User>(
        `SELECT * FROM users
         ORDER BY coins DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('리더보드 조회 실패 (코인):', { limit, error });
      throw error;
    }
  }

  /**
   * 리더보드 조회 (레벨 기준)
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  static async getLeaderboardByLevel(limit: number = 10): Promise<User[]> {
    try {
      const result = await db.query<User>(
        `SELECT * FROM users
         ORDER BY level DESC, experience DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('리더보드 조회 실패 (레벨):', { limit, error });
      throw error;
    }
  }

  /**
   * 리더보드 조회 (승수 기준)
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  static async getLeaderboardByWins(limit: number = 10): Promise<User[]> {
    try {
      const result = await db.query<User>(
        `SELECT * FROM users
         ORDER BY total_wins DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('리더보드 조회 실패 (승수):', { limit, error });
      throw error;
    }
  }

  /**
   * 사용자 삭제
   * @param userId 사용자 디스코드 ID
   */
  static async delete(userId: string): Promise<void> {
    try {
      await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
      logger.info('사용자 삭제됨:', { userId });
    } catch (error) {
      logger.error('사용자 삭제 실패:', { userId, error });
      throw error;
    }
  }
}
