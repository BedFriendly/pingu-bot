import { Guild } from '@prisma/client';

/**
 * Guild Repository 인터페이스
 * Guild 관련 데이터 접근 로직 정의
 */
export interface IGuildRepository {
  /**
   * ID로 길드 조회
   * @param guildId 길드 디스코드 ID
   * @returns Guild 객체 또는 null
   */
  findById(guildId: string): Promise<Guild | null>;

  /**
   * 길드가 존재하지 않으면 생성, 존재하면 반환
   * @param guildId 길드 디스코드 ID
   * @param guildName 길드 이름
   * @returns Guild 객체
   */
  findOrCreate(guildId: string, guildName: string): Promise<Guild>;

  /**
   * 접두사 업데이트
   * @param guildId 길드 디스코드 ID
   * @param prefix 새 접두사
   * @returns 업데이트된 Guild 객체
   */
  updatePrefix(guildId: string, prefix: string): Promise<Guild>;

  /**
   * 레벨업 채널 업데이트
   * @param guildId 길드 디스코드 ID
   * @param channelId 채널 ID
   * @returns 업데이트된 Guild 객체
   */
  updateLevelChannel(guildId: string, channelId: string | null): Promise<Guild>;

  /**
   * 환영 메시지 채널 업데이트
   * @param guildId 길드 디스코드 ID
   * @param channelId 채널 ID
   * @returns 업데이트된 Guild 객체
   */
  updateWelcomeChannel(
    guildId: string,
    channelId: string | null
  ): Promise<Guild>;

  /**
   * 언어 설정 업데이트
   * @param guildId 길드 디스코드 ID
   * @param language 언어 코드
   * @returns 업데이트된 Guild 객체
   */
  updateLanguage(guildId: string, language: string): Promise<Guild>;

  /**
   * 모든 길드 조회
   * @returns Guild 배열
   */
  findAll(): Promise<Guild[]>;
}
