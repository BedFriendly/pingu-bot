import { Guild, Prisma } from '@prisma/client';

/**
 * Guild DAO 인터페이스
 * guilds 테이블에 대한 CRUD 작업 정의
 */
export interface IGuildDAO {
  /**
   * ID로 길드 조회
   * @param guildId 길드 디스코드 ID
   * @returns Guild 객체 또는 null
   */
  findById(guildId: string): Promise<Guild | null>;

  /**
   * 모든 길드 조회
   * @returns Guild 배열
   */
  findAll(): Promise<Guild[]>;

  /**
   * 새 길드 생성
   * @param data 길드 생성 데이터
   * @returns 생성된 Guild 객체
   */
  create(data: Prisma.GuildCreateInput): Promise<Guild>;

  /**
   * 길드 정보 업데이트
   * @param guildId 길드 디스코드 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 Guild 객체
   */
  update(guildId: string, data: Prisma.GuildUpdateInput): Promise<Guild>;

  /**
   * 길드 삭제
   * @param guildId 길드 디스코드 ID
   */
  delete(guildId: string): Promise<void>;
}
