import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../../types/command';
import { EconomyService } from '../../service/economy/economy.service';
import { DailyRewardReqDto } from '../../service/economy/dto/request/DailyRewardReqDto';
import { DailyRewardEmbed } from '../../embed/daily/DailyRewardEmbed';
import { DailyCooldownError } from '../../errors/economy';
import { logger } from '../../utils/logger';

export default class DailyCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('매일 코인을 받습니다');

  category = 'economy' as const;

  private economyService: EconomyService;

  constructor() {
    this.economyService = new EconomyService();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.user;

    try {
      const reqDto = new DailyRewardReqDto({
        userId: targetUser.id,
        username: targetUser.username,
      });

      const dailyRes = await this.economyService.claimDailyReward(reqDto);

      const embed = DailyRewardEmbed.create({
        username: dailyRes.user.username,
        rewardAmount: dailyRes.rewardAmount,
        newBalance: dailyRes.user.coins,
        nextClaimTime: dailyRes.nextClaimTime,
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      // 쿨다운 오류는 사용자에게 남은 시간 표시
      if (error instanceof DailyCooldownError) {
        await interaction.reply({
          content: `⏰ ${error.message}`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        // 예상치 못한 시스템 오류
        logger.error('Unexpected error claiming daily reward:', error);
        await interaction.reply({
          content:
            '일일 보상을 받는 중에 오류가 발생했습니다. 나중에 다시 시도해주세요.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
}
