import { EmbedBuilder } from 'discord.js';

/**
 * User Level Info Embed
 * 사용자 레벨 정보를 표시하는 임베드
 */
export class UserLevelInfoEmbed {
  /**
   * 레벨 정보 임베드 생성
   */
  static create(props: {
    username: string;
    level: number;
    currentXp: number;
    requiredXp: number;
    progress: number;
  }): EmbedBuilder {
    const { username, level, currentXp, requiredXp, progress } = props;

    // 프로그레스 바 생성
    const progressBarLength = 20;
    const filledLength = Math.floor((progress / 100) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

    return new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('📊 레벨 정보')
      .setDescription(`**${username}**님의 레벨 정보`)
      .addFields(
        { name: '레벨', value: `Lv. ${level}`, inline: true },
        {
          name: '경험치',
          value: `${currentXp.toLocaleString()} / ${requiredXp.toLocaleString()} XP`,
          inline: true,
        },
        {
          name: '진행률',
          value: `${progressBar} ${progress}%`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Pingu Bot Leveling System' });
  }
}
