import { GameStat, Prisma } from '@prisma/client';

/**
 * GameStat DAO 인터페이스
 * game_stats 테이블에 대한 CRUD 작업 정의
 */
export interface IGameStatDAO {
  /**
   * ID로 게임 통계 조회
   * @param id 게임 통계 ID
   * @returns GameStat 객체 또는 null
   */
  findById(id: number): Promise<GameStat | null>;

  /**
   * 사용자의 모든 게임 통계 조회
   * @param userId 사용자 디스코드 ID
   * @returns GameStat 배열
   */
  findByUserId(userId: string): Promise<GameStat[]>;

  /**
   * 특정 게임 타입의 통계 조회
   * @param userId 사용자 디스코드 ID
   * @param gameType 게임 타입
   * @returns GameStat 배열
   */
  findByUserIdAndGameType(
    userId: string,
    gameType: string
  ): Promise<GameStat[]>;

  /**
   * 게임 통계 생성
   * @param data 게임 통계 생성 데이터
   * @returns 생성된 GameStat 객체
   */
  create(data: Prisma.GameStatCreateInput): Promise<GameStat>;

  /**
   * 게임 통계 삭제
   * @param id 게임 통계 ID
   */
  delete(id: number): Promise<void>;

  /**
   * 사용자의 모든 게임 통계 삭제
   * @param userId 사용자 디스코드 ID
   */
  deleteByUserId(userId: string): Promise<void>;
}
