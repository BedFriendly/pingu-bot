import { db } from '../connection';
import { Guild } from '../../types/database';
import { logger } from '../../utils/logger';

/**
 * Guild 모델
 * 길드(서버) 데이터에 대한 CRUD 작업 제공
 */
export class GuildModel {
  /**
   * ID로 길드 조회
   * @param guildId 길드 디스코드 ID
   * @returns Guild 객체 또는 null
   */
  static async findById(guildId: string): Promise<Guild | null> {
    try {
      const result = await db.query<Guild>(
        'SELECT * FROM guilds WHERE guild_id = $1',
        [guildId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('길드 조회 실패:', { guildId, error });
      throw error;
    }
  }

  /**
   * 새 길드 생성
   * @param guildId 길드 디스코드 ID
   * @param guildName 길드 이름
   * @returns 생성된 Guild 객체
   */
  static async create(guildId: string, guildName: string): Promise<Guild> {
    try {
      const result = await db.query<Guild>(
        `INSERT INTO guilds (guild_id, guild_name)
         VALUES ($1, $2)
         RETURNING *`,
        [guildId, guildName]
      );
      logger.info('새 길드 생성됨:', { guildId, guildName });
      return result.rows[0];
    } catch (error) {
      logger.error('길드 생성 실패:', { guildId, guildName, error });
      throw error;
    }
  }

  /**
   * 길드가 존재하지 않으면 생성, 존재하면 반환
   * @param guildId 길드 디스코드 ID
   * @param guildName 길드 이름
   * @returns Guild 객체
   */
  static async findOrCreate(
    guildId: string,
    guildName: string
  ): Promise<Guild> {
    let guild = await this.findById(guildId);
    if (!guild) {
      guild = await this.create(guildId, guildName);
    }
    return guild;
  }

  /**
   * 길드 설정 업데이트
   * @param guildId 길드 디스코드 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 Guild 객체
   */
  static async update(
    guildId: string,
    data: Partial<Omit<Guild, 'guild_id' | 'created_at' | 'updated_at'>>
  ): Promise<Guild> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 동적으로 업데이트 쿼리 생성
      Object.entries(data).forEach(([key, value]) => {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      });

      values.push(guildId);

      const result = await db.query<Guild>(
        `UPDATE guilds
         SET ${fields.join(', ')}
         WHERE guild_id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      logger.error('길드 업데이트 실패:', { guildId, data, error });
      throw error;
    }
  }

  /**
   * 접두사 설정
   * @param guildId 길드 디스코드 ID
   * @param prefix 새 접두사
   * @returns 업데이트된 Guild 객체
   */
  static async setPrefix(guildId: string, prefix: string): Promise<Guild> {
    return this.update(guildId, { prefix });
  }

  /**
   * 레벨업 채널 설정
   * @param guildId 길드 디스코드 ID
   * @param channelId 채널 ID
   * @returns 업데이트된 Guild 객체
   */
  static async setLevelChannel(
    guildId: string,
    channelId: string | null
  ): Promise<Guild> {
    return this.update(guildId, { level_channel_id: channelId });
  }

  /**
   * 환영 메시지 채널 설정
   * @param guildId 길드 디스코드 ID
   * @param channelId 채널 ID
   * @returns 업데이트된 Guild 객체
   */
  static async setWelcomeChannel(
    guildId: string,
    channelId: string | null
  ): Promise<Guild> {
    return this.update(guildId, { welcome_channel_id: channelId });
  }

  /**
   * 언어 설정
   * @param guildId 길드 디스코드 ID
   * @param language 언어 코드 (ko, en 등)
   * @returns 업데이트된 Guild 객체
   */
  static async setLanguage(guildId: string, language: string): Promise<Guild> {
    return this.update(guildId, { language });
  }

  /**
   * 모든 길드 조회
   * @returns Guild 배열
   */
  static async findAll(): Promise<Guild[]> {
    try {
      const result = await db.query<Guild>('SELECT * FROM guilds');
      return result.rows;
    } catch (error) {
      logger.error('모든 길드 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 길드 삭제
   * @param guildId 길드 디스코드 ID
   */
  static async delete(guildId: string): Promise<void> {
    try {
      await db.query('DELETE FROM guilds WHERE guild_id = $1', [guildId]);
      logger.info('길드 삭제됨:', { guildId });
    } catch (error) {
      logger.error('길드 삭제 실패:', { guildId, error });
      throw error;
    }
  }
}
