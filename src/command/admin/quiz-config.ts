import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import { Command } from '../../types/command';
import { QuizService } from '../../service/quiz/quiz.service';
import { QuizChannelSetReqDto } from '../../service/quiz/dto/request/QuizChannelSetReqDto';
import { logger } from '../../utils/logger';
import { config } from '../../config/config';

/**
 * Quiz Config Command (관리자 전용)
 * 퀴즈 설정을 관리하는 커맨드
 */
export default class QuizConfigCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('quiz-config')
    .setDescription('퀴즈 설정을 관리합니다 (관리자 전용)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('퀴즈 채널을 설정합니다')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('퀴즈를 전송할 채널')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('disable')
        .setDescription('퀴즈 시스템을 비활성화합니다')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('view').setDescription('현재 퀴즈 설정을 확인합니다')
    );

  category = 'admin' as const;
  cooldown = 5;

  private quizService: QuizService;

  constructor() {
    this.quizService = new QuizService();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    try {
      switch (subcommand) {
        case 'set':
          await this.handleSet(interaction, guildId);
          break;
        case 'disable':
          await this.handleDisable(interaction, guildId);
          break;
        case 'view':
          await this.handleView(interaction, guildId);
          break;
      }
    } catch (error) {
      logger.error('퀴즈 설정 실패:', error);
      await interaction.reply({
        content: `❌ 설정 중 오류가 발생했습니다: ${(error as Error).message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  private async handleSet(
    interaction: ChatInputCommandInteraction,
    guildId: string
  ): Promise<void> {
    const channel = interaction.options.getChannel(
      'channel',
      true
    ) as TextChannel;

    const reqDto = new QuizChannelSetReqDto({
      guildId,
      channelId: channel.id,
    });

    await this.quizService.setQuizChannel(reqDto);

    await interaction.reply({
      content: `✅ 퀴즈 채널이 <#${channel.id}>로 설정되었습니다.\n퀴즈는 \`${config.quiz.generationCron}\` 주기로 생성됩니다.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleDisable(
    interaction: ChatInputCommandInteraction,
    guildId: string
  ): Promise<void> {
    await this.quizService.disableQuiz(guildId);

    await interaction.reply({
      content: '✅ 퀴즈 시스템이 비활성화되었습니다.',
      flags: MessageFlags.Ephemeral,
    });
  }

  private async handleView(
    interaction: ChatInputCommandInteraction,
    guildId: string
  ): Promise<void> {
    const quizConfig = await this.quizService.getConfig(guildId);

    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('⚙️ 퀴즈 설정')
      .setTimestamp();

    if (quizConfig) {
      embed.addFields(
        {
          name: '상태',
          value: '✅ 활성화',
          inline: true,
        },
        {
          name: '퀴즈 채널',
          value: `<#${quizConfig.quizChannelId}>`,
          inline: true,
        },
        {
          name: '생성 주기',
          value: `\`${config.quiz.generationCron}\``,
          inline: true,
        },
        {
          name: '제한 시간',
          value: `${Math.floor(config.quiz.timeLimit / 1000)}초`,
          inline: true,
        },
        {
          name: '보상',
          value: '100 PC',
          inline: true,
        }
      );
    } else {
      embed.setDescription(
        '❌ 퀴즈가 비활성화되어 있습니다.\n`/quiz-config set` 명령어로 설정하세요.'
      );
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
