import { EmbedBuilder } from 'discord.js';

/**
 * Daily Reward Embed
 * 일일 보상 지급 결과를 표시하는 임베드
 */
export class DailyRewardEmbed {
  /**
   * 일일 보상 성공 임베드 생성
   */
  static create(props: {
    username: string;
    rewardAmount: number;
    newBalance: number;
    nextClaimTime: Date;
  }): EmbedBuilder {
    const { username, rewardAmount, newBalance, nextClaimTime } = props;

    return new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🎁 일일 보상')
      .setDescription(`**${username}**님이 일일 보상을 받았습니다!`)
      .addFields(
        {
          name: '받은 금액',
          value: `${rewardAmount.toLocaleString()} PC`,
          inline: true,
        },
        {
          name: '현재 잔액',
          value: `${newBalance.toLocaleString()} PC`,
          inline: true,
        },
        {
          name: '다음 보상',
          value: `<t:${Math.floor(nextClaimTime.getTime() / 1000)}:R>`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Pingu Bot Economy System' });
  }
}
