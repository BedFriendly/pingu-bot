import 'dotenv/config';

import { prisma, prismaService } from '../prisma';
import { logger } from '../../utils/logger';

/**
 * 마이그레이션 러너
 * Prisma Migrate를 사용하도록 변경됨
 * 이 파일은 레거시 호환성을 위해 유지
 */
async function runMigrations(): Promise<void> {
  logger.info('데이터베이스 마이그레이션 시작...');

  try {
    // 데이터베이스 연결 테스트
    const connected = await prismaService.testConnection();
    if (!connected) {
      throw new Error('데이터베이스 연결에 실패했습니다.');
    }

    // Prisma Migrate 사용 권장
    logger.info(
      'Prisma를 사용하는 경우 "yarn prisma:migrate" 명령어를 사용하세요.'
    );

    // 마이그레이션 버전 테이블 생성 (존재하지 않는 경우)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;

    logger.info('마이그레이션 테이블 확인 완료');
    logger.info('모든 마이그레이션이 완료되었습니다.');
  } catch (error) {
    logger.error('마이그레이션 실패:', error);
    throw error;
  } finally {
    await prismaService.disconnect();
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
