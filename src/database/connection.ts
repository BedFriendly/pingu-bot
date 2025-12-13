/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

/**
 * PostgreSQL 연결 풀
 * 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 Pool 인스턴스만 사용
 */
class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // 최대 연결 수
      idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
      connectionTimeoutMillis: 2000, // 연결 타임아웃 (2초)
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });

    // 연결 풀 이벤트 핸들러
    this.pool.on('connect', () => {
      logger.debug('PostgreSQL 클라이언트 연결됨');
    });

    this.pool.on('error', (err) => {
      logger.error('PostgreSQL 풀 에러:', err);
    });

    this.pool.on('remove', () => {
      logger.debug('PostgreSQL 클라이언트 제거됨');
    });
  }

  /**
   * Database 싱글톤 인스턴스 반환
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * 쿼리 실행
   * @param text SQL 쿼리 문자열
   * @param params 쿼리 파라미터
   * @returns 쿼리 결과
   */
  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      logger.debug(`쿼리 실행됨: ${text} (${duration}ms)`);
      return result;
    } catch (error) {
      logger.error('쿼리 실행 에러:', { text, params, error });
      throw error;
    }
  }

  /**
   * 트랜잭션 실행
   * @param callback 트랜잭션 내에서 실행할 콜백 함수
   * @returns 콜백 함수의 반환값
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('트랜잭션 롤백됨:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 클라이언트 연결 가져오기
   * @returns PoolClient
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * 연결 풀 종료
   */
  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('PostgreSQL 연결 풀이 종료되었습니다.');
  }

  /**
   * 데이터베이스 연결 테스트
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      logger.info('데이터베이스 연결 성공:', result.rows[0]);
      return true;
    } catch (error) {
      logger.error('데이터베이스 연결 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const db = Database.getInstance();
