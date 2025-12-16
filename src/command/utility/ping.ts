import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types/command';

/**
 * Ping Command (Class 기반)
 * 봇의 레이턴시와 API 응답 시간을 확인하는 커맨드
 */
export default class PingCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency and API response time');

  category = 'utility' as const;
  cooldown = 3;

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({
      content: '🏓 Pinging...',
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    });

    const roundtripLatency =
      sent.interaction.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply({
      content: [
        '🏓 **Pong!**',
        `📡 Roundtrip Latency: \`${roundtripLatency}ms\``,
        `⚡ WebSocket Latency: \`${apiLatency}ms\``,
      ].join('\n'),
    });
  }
}
