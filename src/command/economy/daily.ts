import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../../types/command';
import { EconomyService } from '../../service/economy/economy.service';
import { DailyRewardReqDto } from '../../service/economy/dto/request/DailyRewardReqDto';
import { DailyRewardEmbed } from '../../embed/daily/DailyRewardEmbed';

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
      console.error('Error claiming daily reward:', error);
      await interaction.reply({
        content:
          '일일 보상을 받는 중에 오류가 발생했습니다. 나중에 다시 시도해주세요.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
