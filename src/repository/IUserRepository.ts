import { User } from '@prisma/client';

/**
 * User Repository 인터페이스
 * User 관련 데이터 접근 로직 정의
 * 주의: 비즈니스 로직은 포함하지 않음 (Service 레이어에서 처리)
 */
export interface IUserRepository {
  /**
   * ID로 사용자 조회
   * @param userId 사용자 디스코드 ID
   * @returns User 객체 또는 null
   */
  findById(userId: string): Promise<User | null>;

  /**
   * 사용자가 존재하지 않으면 생성, 존재하면 반환
   * @param userId 사용자 디스코드 ID
   * @param username 사용자 이름
   * @returns User 객체
   */
  findOrCreate(userId: string, username: string): Promise<User>;

  /**
   * 사용자 정보 업데이트
   * @param userId 사용자 디스코드 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 User 객체
   */
  updateUser(
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
  ): Promise<User>;

  /**
   * 코인 전송 (트랜잭션)
   * @param fromId 보내는 사용자 ID
   * @param toId 받는 사용자 ID
   * @param amount 전송할 코인 양
   * @returns 업데이트된 sender, receiver
   */
  transferCoins(
    fromId: string,
    toId: string,
    amount: number
  ): Promise<{ sender: User; receiver: User }>;

  /**
   * 일일 보상 시간 업데이트
   * @param userId 사용자 디스코드 ID
   * @returns 업데이트된 User 객체
   */
  updateLastDaily(userId: string): Promise<User>;

  /**
   * 코인 기준 리더보드 조회
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  getLeaderboardByCoins(limit: number): Promise<User[]>;

  /**
   * 레벨 기준 리더보드 조회
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  getLeaderboardByLevel(limit: number): Promise<User[]>;

  /**
   * 승수 기준 리더보드 조회
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  getLeaderboardByWins(limit: number): Promise<User[]>;
}
