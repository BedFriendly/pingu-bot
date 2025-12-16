import { User, Prisma } from '@prisma/client';

/**
 * User DAO 인터페이스
 * users 테이블에 대한 CRUD 작업 정의
 */
export interface IUserDAO {
  /**
   * ID로 사용자 조회
   * @param userId 사용자 디스코드 ID
   * @returns User 객체 또는 null
   */
  findById(userId: string): Promise<User | null>;

  /**
   * 여러 사용자 조회
   * @param userIds 사용자 ID 배열
   * @returns User 배열
   */
  findMany(userIds: string[]): Promise<User[]>;

  /**
   * 모든 사용자 조회
   * @returns User 배열
   */
  findAll(): Promise<User[]>;

  /**
   * 새 사용자 생성
   * @param data 사용자 생성 데이터
   * @returns 생성된 User 객체
   */
  create(data: Prisma.UserCreateInput): Promise<User>;

  /**
   * 사용자 정보 업데이트
   * @param userId 사용자 디스코드 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 User 객체
   */
  update(userId: string, data: Prisma.UserUpdateInput): Promise<User>;

  /**
   * 사용자 삭제
   * @param userId 사용자 디스코드 ID
   */
  delete(userId: string): Promise<void>;

  /**
   * 코인 증감 (원자적 연산)
   * @param userId 사용자 디스코드 ID
   * @param amount 증감할 코인 양 (음수 가능)
   * @returns 업데이트된 User 객체
   */
  incrementCoins(userId: string, amount: number): Promise<User>;

  /**
   * 경험치 증감 (원자적 연산)
   * @param userId 사용자 디스코드 ID
   * @param amount 증감할 경험치 양 (음수 가능)
   * @returns 업데이트된 User 객체
   */
  incrementExperience(userId: string, amount: number): Promise<User>;

  /**
   * 코인 기준 리더보드 조회
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  getTopByCoins(limit: number): Promise<User[]>;

  /**
   * 레벨 기준 리더보드 조회
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  getTopByLevel(limit: number): Promise<User[]>;

  /**
   * 승수 기준 리더보드 조회
   * @param limit 조회할 사용자 수
   * @returns User 배열
   */
  getTopByWins(limit: number): Promise<User[]>;
}
