import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  User as DiscordUser,
} from 'discord.js';
import { Command } from '../../types/command';
import { UserModel } from '../../database/models';
import { CONSTANTS } from '../../config/constants';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('사용자의 코인 잔액과 레벨 정보를 확인합니다')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(
          '정보를 확인할 사용자 (선택하지 않으면 자신의 정보 표시)'
        )
        .setRequired(false)
    ),
  category: 'economy',
  cooldown: 5,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const targetUser =
      (interaction.options.getUser('user') as DiscordUser) || interaction.user;

    try {
      // 데이터베이스에서 사용자 정보 조회
      const user = await UserModel.findById(targetUser.id);

      if (!user) {
        await interaction.reply({
          content: '❌ 사용자 정보를 찾을 수 없습니다.',
          ephemeral: true,
        });
        return;
      }

      // 다음 레벨까지 필요한 경험치 계산
      const nextLevelXP = Math.floor(100 * Math.pow(user.level, 1.5));
      const progress = ((user.experience / nextLevelXP) * 100).toFixed(1);

      // 프로그레스 바 생성
      const progressBarLength = 20;
      const filledLength = Math.floor(
        (user.experience / nextLevelXP) * progressBarLength
      );
      const progressBar =
        '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);

      // 승률 계산
      const winRate =
        user.total_games > 0
          ? ((user.total_wins / user.total_games) * 100).toFixed(1)
          : '0.0';

      const embed = new EmbedBuilder()
        .setTitle(`💰 ${targetUser.username}님의 정보`)
        .setColor(CONSTANTS.COLORS.SUCCESS)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          {
            name: '💵 잔액',
            value: `**${user.coins.toLocaleString()} PC**`,
            inline: true,
          },
          {
            name: '⬆️ 레벨',
            value: `**${user.level}**`,
            inline: true,
          },
          {
            name: '✨ 경험치',
            value: `${user.experience.toLocaleString()} / ${nextLevelXP.toLocaleString()} XP`,
            inline: true,
          },
          {
            name: '📊 진행도',
            value: `${progressBar} ${progress}%`,
            inline: false,
          },
          {
            name: '🎮 게임 통계',
            value: [
              `총 게임: **${user.total_games}회**`,
              `승리: **${user.total_wins}회**`,
              `승률: **${winRate}%**`,
            ].join('\n'),
            inline: true,
          },
          {
            name: '🎁 일일 보상',
            value: user.last_daily
              ? `마지막 수령: <t:${Math.floor(new Date(user.last_daily).getTime() / 1000)}:R>`
              : '아직 수령하지 않음',
            inline: true,
          }
        )
        .setFooter({
          text: `가입일: ${new Date(user.created_at).toLocaleDateString('ko-KR')}`,
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({
        content: '❌ 정보를 불러오는 중 오류가 발생했습니다.',
        ephemeral: true,
      });
    }
  },
};

export default command;
