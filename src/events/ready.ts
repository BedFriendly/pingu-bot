import { Client } from 'discord.js';
import { BotEvent } from '../types/event';
import { logger } from '../utils/logger';
import { db } from '../database';

const event: BotEvent<'clientReady'> = {
  name: 'clientReady',
  once: true,
  execute: async (client: Client) => {
    if (!client.user) return;

    logger.info(`✅ Logged in as ${client.user.tag}`);
    logger.info(`📊 Serving ${client.guilds.cache.size} guilds`);
    logger.info(`👥 Total users: ${client.users.cache.size}`);

    // 데이터베이스 연결 상태 확인
    try {
      const dbConnected = await db.testConnection();
      if (dbConnected) {
        logger.info('💾 Database connection verified');
      }
    } catch (error) {
      logger.error('💾 Database connection check failed:', error);
    }

    logger.info('🐧 Pingu Bot is ready!');

    client.user.setActivity('with penguins 🐧', { type: 0 });
  },
};

export default event;
