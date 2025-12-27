import { EmbedBuilder } from 'discord.js';

/**
 * Coin Transfer Embed
 * 코인 전송 결과를 표시하는 임베드
 */
export class CoinTransferEmbed {
  /**
   * 코인 전송 성공 임베드 생성
   */
  static create(props: {
    senderName: string;
    receiverName: string;
    amount: number;
    senderBalance: number;
    receiverBalance: number;
  }): EmbedBuilder {
    const { senderName, receiverName, amount, senderBalance, receiverBalance } =
      props;

    return new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💸 코인 전송 완료')
      .setDescription(`**${senderName}** → **${receiverName}**`)
      .addFields(
        {
          name: '전송 금액',
          value: `${amount.toLocaleString()} PC`,
          inline: false,
        },
        {
          name: `${senderName}의 잔액`,
          value: `${senderBalance.toLocaleString()} PC`,
          inline: true,
        },
        {
          name: `${receiverName}의 잔액`,
          value: `${receiverBalance.toLocaleString()} PC`,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Pingu Bot Economy System' });
  }
}
