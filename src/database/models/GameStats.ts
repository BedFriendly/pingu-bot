import { db } from '../connection';
import { GameStats } from '../../types/database';
import { logger } from '../../utils/logger';

/**
 * GameStats 모델
 * 게임 통계 데이터에 대한 CRUD 작업 제공
 */
export class GameStatsModel {
  /**
   * 게임 기록 생성
   * @param data 게임 기록 데이터
   * @returns 생성된 GameStats 객체
   */
  static async create(
    data: Omit<GameStats, 'id' | 'played_at'>
  ): Promise<GameStats> {
    try {
      const result = await db.query<GameStats>(
        `INSERT INTO game_stats (user_id, game_type, result, bet_amount, profit)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          data.user_id,
          data.game_type,
          data.result,
          data.bet_amount,
          data.profit,
        ]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('게임 기록 생성 실패:', { data, error });
      throw error;
    }
  }

  /**
   * 사용자의 게임 기록 조회
   * @param userId 사용자 디스코드 ID
   * @param limit 조회할 기록 수
   * @returns GameStats 배열
   */
  static async findByUserId(
    userId: string,
    limit: number = 50
  ): Promise<GameStats[]> {
    try {
      const result = await db.query<GameStats>(
        `SELECT * FROM game_stats
         WHERE user_id = $1
         ORDER BY played_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('게임 기록 조회 실패:', { userId, limit, error });
      throw error;
    }
  }

  /**
   * 사용자의 특정 게임 타입 기록 조회
   * @param userId 사용자 디스코드 ID
   * @param gameType 게임 타입
   * @param limit 조회할 기록 수
   * @returns GameStats 배열
   */
  static async findByUserAndGame(
    userId: string,
    gameType: GameStats['game_type'],
    limit: number = 50
  ): Promise<GameStats[]> {
    try {
      const result = await db.query<GameStats>(
        `SELECT * FROM game_stats
         WHERE user_id = $1 AND game_type = $2
         ORDER BY played_at DESC
         LIMIT $3`,
        [userId, gameType, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('게임 타입별 기록 조회 실패:', {
        userId,
        gameType,
        limit,
        error,
      });
      throw error;
    }
  }

  /**
   * 사용자의 게임 통계 요약
   * @param userId 사용자 디스코드 ID
   * @returns 통계 객체
   */
  static async getUserStats(userId: string): Promise<{
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    winRate: number;
    totalProfit: number;
  }> {
    try {
      const result = await db.query(
        `SELECT
           COUNT(*) as total_games,
           COUNT(*) FILTER (WHERE result = 'win') as total_wins,
           COUNT(*) FILTER (WHERE result = 'loss') as total_losses,
           COUNT(*) FILTER (WHERE result = 'draw') as total_draws,
           COALESCE(SUM(profit), 0) as total_profit
         FROM game_stats
         WHERE user_id = $1`,
        [userId]
      );

      const row = result.rows[0];
      const totalGames = parseInt(row.total_games);
      const totalWins = parseInt(row.total_wins);
      const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      return {
        totalGames,
        totalWins,
        totalLosses: parseInt(row.total_losses),
        totalDraws: parseInt(row.total_draws),
        winRate: Math.round(winRate * 100) / 100,
        totalProfit: parseInt(row.total_profit),
      };
    } catch (error) {
      logger.error('게임 통계 조회 실패:', { userId, error });
      throw error;
    }
  }

  /**
   * 게임 타입별 통계 조회
   * @param userId 사용자 디스코드 ID
   * @param gameType 게임 타입
   * @returns 통계 객체
   */
  static async getGameTypeStats(
    userId: string,
    gameType: GameStats['game_type']
  ): Promise<{
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    winRate: number;
    totalProfit: number;
  }> {
    try {
      const result = await db.query(
        `SELECT
           COUNT(*) as total_games,
           COUNT(*) FILTER (WHERE result = 'win') as total_wins,
           COUNT(*) FILTER (WHERE result = 'loss') as total_losses,
           COUNT(*) FILTER (WHERE result = 'draw') as total_draws,
           COALESCE(SUM(profit), 0) as total_profit
         FROM game_stats
         WHERE user_id = $1 AND game_type = $2`,
        [userId, gameType]
      );

      const row = result.rows[0];
      const totalGames = parseInt(row.total_games);
      const totalWins = parseInt(row.total_wins);
      const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      return {
        totalGames,
        totalWins,
        totalLosses: parseInt(row.total_losses),
        totalDraws: parseInt(row.total_draws),
        winRate: Math.round(winRate * 100) / 100,
        totalProfit: parseInt(row.total_profit),
      };
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
   * 전체 게임 통계 (리더보드용)
   * @param gameType 게임 타입 (선택사항)
   * @param limit 조회할 사용자 수
   * @returns 사용자별 통계 배열
   */
  static async getGlobalStats(
    gameType?: GameStats['game_type'],
    limit: number = 10
  ): Promise<
    Array<{
      user_id: string;
      total_games: number;
      total_wins: number;
      win_rate: number;
      total_profit: number;
    }>
  > {
    try {
      let query = `
        SELECT
          user_id,
          COUNT(*) as total_games,
          COUNT(*) FILTER (WHERE result = 'win') as total_wins,
          ROUND(
            CASE
              WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE result = 'win')::NUMERIC / COUNT(*)) * 100
              ELSE 0
            END,
            2
          ) as win_rate,
          COALESCE(SUM(profit), 0) as total_profit
        FROM game_stats
      `;

      const params: any[] = [];
      if (gameType) {
        query += ' WHERE game_type = $1';
        params.push(gameType);
      }

      query += `
        GROUP BY user_id
        ORDER BY total_wins DESC
        LIMIT $${params.length + 1}
      `;

      params.push(limit);

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('전체 게임 통계 조회 실패:', { gameType, limit, error });
      throw error;
    }
  }

  /**
   * 특정 기간의 게임 기록 조회
   * @param userId 사용자 디스코드 ID
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns GameStats 배열
   */
  static async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GameStats[]> {
    try {
      const result = await db.query<GameStats>(
        `SELECT * FROM game_stats
         WHERE user_id = $1 AND played_at BETWEEN $2 AND $3
         ORDER BY played_at DESC`,
        [userId, startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      logger.error('기간별 게임 기록 조회 실패:', {
        userId,
        startDate,
        endDate,
        error,
      });
      throw error;
    }
  }

  /**
   * 게임 기록 삭제
   * @param id 게임 기록 ID
   */
  static async delete(id: number): Promise<void> {
    try {
      await db.query('DELETE FROM game_stats WHERE id = $1', [id]);
      logger.info('게임 기록 삭제됨:', { id });
    } catch (error) {
      logger.error('게임 기록 삭제 실패:', { id, error });
      throw error;
    }
  }

  /**
   * 사용자의 모든 게임 기록 삭제
   * @param userId 사용자 디스코드 ID
   */
  static async deleteByUserId(userId: string): Promise<void> {
    try {
      await db.query('DELETE FROM game_stats WHERE user_id = $1', [userId]);
      logger.info('사용자 게임 기록 전체 삭제됨:', { userId });
    } catch (error) {
      logger.error('사용자 게임 기록 삭제 실패:', { userId, error });
      throw error;
    }
  }
}
