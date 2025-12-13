/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Collection, Interaction } from 'discord.js';
import { BotEvent } from '../types/event';
import { PinguBot } from '../bot';
import logger from '../utils/logger';

const event: BotEvent = {
  name: 'interactionCreate',
  execute: async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as PinguBot;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    // Cooldown handling
    if (command.cooldown) {
      const { cooldowns } = client;

      if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name)!;
      const cooldownAmount = command.cooldown * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime =
          timestamps.get(interaction.user.id)! + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          await interaction.reply({
            content: `⏰ Please wait ${timeLeft.toFixed(1)} more second(s) before using \`${command.data.name}\` again.`,
            ephemeral: true,
          });
          return;
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    }

    // Execute command
    try {
      await command.execute(interaction);
      logger.info(
        `✓ ${interaction.user.tag} used /${command.data.name} in ${interaction.guild?.name || 'DM'}`
      );
    } catch (error) {
      logger.error(`Error executing command ${command.data.name}:`, error);

      const errorMessage = {
        content: '❌ An error occurred while executing this command.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};

export default event;
