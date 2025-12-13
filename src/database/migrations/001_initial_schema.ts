import { PoolClient } from 'pg';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 초기 스키마 마이그레이션
 * schema.sql 파일을 읽어서 데이터베이스에 적용
 */
export async function up(client: PoolClient): Promise<void> {
  logger.info('마이그레이션 001_initial_schema 실행 중...');

  try {
    // schema.sql 파일 읽기
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // 스키마 실행
    await client.query(schemaSql);

    logger.info('마이그레이션 001_initial_schema 완료');
  } catch (error) {
    logger.error('마이그레이션 001_initial_schema 실패:', error);
    throw error;
  }
}

/**
 * 롤백 함수
 * 초기 스키마를 롤백 (모든 테이블 삭제)
 */
export async function down(client: PoolClient): Promise<void> {
  logger.info('마이그레이션 001_initial_schema 롤백 중...');

  try {
    await client.query(`
      DROP TABLE IF EXISTS cooldowns CASCADE;
      DROP TABLE IF EXISTS game_stats CASCADE;
      DROP TABLE IF EXISTS guilds CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
      DROP FUNCTION IF EXISTS delete_expired_cooldowns CASCADE;
    `);

    logger.info('마이그레이션 001_initial_schema 롤백 완료');
  } catch (error) {
    logger.error('마이그레이션 001_initial_schema 롤백 실패:', error);
    throw error;
  }
}
