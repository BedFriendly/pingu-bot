import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  User as DiscordUser,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types/command';
import { EconomyService } from '../../service/economy/economy.service';
import { UserBalanceReqDto } from '../../service/economy/dto/request/UserBalanceReqDto';
import { UserBalanceEmbed } from '../../embed/balance/UserBalanceEmbed';
import { logger } from '../../utils/logger';

/**
 * Balance Command (Class 기반)
 * 사용자의 코인 잔액과 레벨 정보를 확인하는 커맨드
 */
export default class BalanceCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('사용자의 코인 잔액과 레벨 정보를 확인합니다')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(
          '정보를 확인할 사용자 (선택하지 않으면 자신의 정보 표시)'
        )
        .setRequired(false)
    );

  category = 'economy' as const;
  cooldown = 5;

  private economyService: EconomyService;

  constructor() {
    this.economyService = new EconomyService();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser =
      (interaction.options.getUser('user') as DiscordUser) || interaction.user;

    try {
      // Request DTO 생성
      const reqDto = new UserBalanceReqDto({
        userId: targetUser.id,
        username: targetUser.username,
      });

      // Service 레이어 호출
      const balanceRes = await this.economyService.getBalance(reqDto);

      // Embed 생성 (Command에서만 호출)
      const embed = UserBalanceEmbed.create({
        username: balanceRes.user.username,
        coins: balanceRes.user.coins,
        level: balanceRes.user.level,
      });

      // 전송 (Command의 책임)
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('잔액 조회 실패:', error);
      await interaction.reply({
        content: '❌ 정보를 불러오는 중 오류가 발생했습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
