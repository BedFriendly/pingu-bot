import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Prisma Client 싱글톤 인스턴스
 * 애플리케이션 전체에서 하나의 Prisma Client 인스턴스만 사용
 */
class PrismaService {
  private static instance: PrismaService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });

    // Prisma 연결 이벤트 핸들러
    this.prisma.$connect().then(() => {
      logger.info('Prisma Client 연결 성공');
    });
  }

  /**
   * PrismaService 싱글톤 인스턴스 반환
   */
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Prisma Client 반환
   */
  public getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * 연결 종료
   */
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Prisma Client 연결 종료');
  }

  /**
   * 데이터베이스 연결 테스트
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      logger.info('데이터베이스 연결 성공');
      return true;
    } catch (error) {
      logger.error('데이터베이스 연결 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const prisma = PrismaService.getInstance().getClient();
export const prismaService = PrismaService.getInstance();
