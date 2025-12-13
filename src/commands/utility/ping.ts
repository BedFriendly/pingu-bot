import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types/command';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency and API response time'),
  category: 'utility',
  cooldown: 3,
  execute: async (interaction: ChatInputCommandInteraction) => {
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
  },
};

export default command;
