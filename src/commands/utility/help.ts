import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Command } from '../../types/command';
import { PinguBot } from '../../bot';
import { CONSTANTS } from '../../config/constants';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available commands and their descriptions'),
  category: 'utility',
  execute: async (interaction: ChatInputCommandInteraction) => {
    const client = interaction.client as PinguBot;

    // Group commands by category
    const categories: Record<string, Command[]> = {
      games: [],
      economy: [],
      leveling: [],
      fun: [],
      utility: [],
    };

    client.commands.forEach((cmd) => {
      categories[cmd.category].push(cmd);
    });

    const embed = new EmbedBuilder()
      .setTitle('🐧 Pingu Bot - Help')
      .setDescription('Here are all available commands:')
      .setColor(CONSTANTS.COLORS.INFO)
      .setTimestamp();

    // Add fields for each category with commands
    for (const [category, commands] of Object.entries(categories)) {
      if (commands.length === 0) continue;

      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const commandList = commands
        .map((cmd) => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
        .join('\n');

      embed.addFields({
        name: `${getCategoryEmoji(category)} ${categoryName}`,
        value: commandList || 'No commands',
        inline: false,
      });
    }

    embed.setFooter({
      text: `Requested by ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    });

    await interaction.reply({ embeds: [embed] });
  },
};

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    games: '🎮',
    economy: '🪙',
    leveling: '⬆️',
    fun: '🎉',
    utility: '🔧',
  };
  return emojis[category] || '📁';
}

export default command;
