import { Guild } from '@prisma/client';
import { IGuildRepository } from '../IGuildRepository';
import { IGuildDAO } from '../../database/dao/IGuildDAO';
import { GuildDAO } from '../../database/dao/impl/GuildDAO';

/**
 * Guild Repository 구현체
 * Guild DAO를 주입받아 데이터 접근 로직 제공
 */
export class GuildRepository implements IGuildRepository {
  constructor(private guildDAO: IGuildDAO = new GuildDAO()) {}

  /**
   * ID로 길드 조회
   */
  async findById(guildId: string): Promise<Guild | null> {
    return await this.guildDAO.findById(guildId);
  }

  /**
   * 길드가 존재하지 않으면 생성, 존재하면 반환
   */
  async findOrCreate(guildId: string, guildName: string): Promise<Guild> {
    let guild = await this.guildDAO.findById(guildId);
    if (!guild) {
      guild = await this.guildDAO.create({ guildId, guildName });
    }
    return guild;
  }

  /**
   * 접두사 업데이트
   */
  async updatePrefix(guildId: string, prefix: string): Promise<Guild> {
    return await this.guildDAO.update(guildId, { prefix });
  }

  /**
   * 레벨업 채널 업데이트
   */
  async updateLevelChannel(
    guildId: string,
    channelId: string | null
  ): Promise<Guild> {
    return await this.guildDAO.update(guildId, { levelChannelId: channelId });
  }

  /**
   * 환영 메시지 채널 업데이트
   */
  async updateWelcomeChannel(
    guildId: string,
    channelId: string | null
  ): Promise<Guild> {
    return await this.guildDAO.update(guildId, {
      welcomeChannelId: channelId,
    });
  }

  /**
   * 언어 설정 업데이트
   */
  async updateLanguage(guildId: string, language: string): Promise<Guild> {
    return await this.guildDAO.update(guildId, { language });
  }

  /**
   * 모든 길드 조회
   */
  async findAll(): Promise<Guild[]> {
    return await this.guildDAO.findAll();
  }
}
