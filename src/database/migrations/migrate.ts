import 'dotenv/config';

import { db } from '../connection';
import { logger } from '../../utils/logger';

/**
 * 마이그레이션 러너
 * 모든 마이그레이션 파일을 순차적으로 실행
 */
async function runMigrations(): Promise<void> {
  logger.info('데이터베이스 마이그레이션 시작...');

  try {
    // 데이터베이스 연결 테스트
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('데이터베이스 연결에 실패했습니다.');
    }

    // 마이그레이션 버전 테이블 생성 (존재하지 않는 경우)
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // 실행할 마이그레이션 목록
    const migrations = [
      { name: '001_initial_schema', module: require('./001_initial_schema') },
    ];

    // 각 마이그레이션 실행
    for (const migration of migrations) {
      // 이미 실행된 마이그레이션인지 확인
      const result = await db.query(
        'SELECT * FROM migrations WHERE name = $1',
        [migration.name]
      );

      if (result.rows.length > 0) {
        logger.info(`마이그레이션 ${migration.name}은(는) 이미 실행됨`);
        continue;
      }

      // 트랜잭션으로 마이그레이션 실행
      await db.transaction(async (client) => {
        logger.info(`마이그레이션 ${migration.name} 실행 중...`);
        await migration.module.up(client);

        // 마이그레이션 기록 저장
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [
          migration.name,
        ]);

        logger.info(`마이그레이션 ${migration.name} 완료`);
      });
    }

    logger.info('모든 마이그레이션이 완료되었습니다.');
  } catch (error) {
    logger.error('마이그레이션 실패:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// 스크립트로 직접 실행하는 경우
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('마이그레이션 프로세스 완료');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('마이그레이션 프로세스 실패:', error);
      process.exit(1);
    });
}

export { runMigrations };
