import { Client } from 'discord.js';
import { BotEvent } from '../types/event';
import logger from '../utils/logger';

const event: BotEvent = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    if (!client.user) return;

    logger.info(`✅ Logged in as ${client.user.tag}`);
    logger.info(`📊 Serving ${client.guilds.cache.size} guilds`);
    logger.info(`👥 Total users: ${client.users.cache.size}`);
    logger.info('🐧 Pingu Bot is ready!');

    client.user.setActivity('with penguins 🐧', { type: 0 });
  },
};

export default event;
