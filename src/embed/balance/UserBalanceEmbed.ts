import { EmbedBuilder } from 'discord.js';

/**
 * User Balance Embed
 * 사용자 잔액 정보를 표시하는 임베드
 */
export class UserBalanceEmbed {
  /**
   * 잔액 임베드 생성
   */
  static create(props: {
    username: string;
    coins: number;
    level: number;
  }): EmbedBuilder {
    const { username, coins, level } = props;

    return new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💰 잔액 조회')
      .setDescription(`**${username}**님의 잔액 정보`)
      .addFields(
        {
          name: '보유 코인',
          value: `${coins.toLocaleString()} PC`,
          inline: true,
        },
        { name: '레벨', value: `Lv. ${level}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Pingu Bot Economy System' });
  }
}
