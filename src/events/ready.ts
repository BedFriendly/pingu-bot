import { Client } from 'discord.js';
import { BotEvent } from '../types/event';

const event: BotEvent = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    if (!client.user) return;

    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    console.log(`👥 Total users: ${client.users.cache.size}`);
    console.log('🐧 Pingu Bot is ready!');

    client.user.setActivity('with penguins 🐧', { type: 0 });
  },
};

export default event;
