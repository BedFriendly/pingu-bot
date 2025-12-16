import {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Command } from './types/command';
import { config } from './config/config';
import { logger } from './utils/logger';
import { prismaService } from './database';

export class PinguBot extends Client {
  public commands: Collection<string, Command>;
  public cooldowns: Collection<string, Collection<string, number>>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting Pingu Bot...');

      // 데이터베이스 연결 확인
      await this.initializeDatabase();

      await this.loadCommands();
      await this.loadEvents();
      await this.registerSlashCommands();
      await this.login(config.discord.token);

      logger.info('Pingu Bot started successfully!');
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      logger.info('Initializing database connection...');
      const connected = await prismaService.testConnection();

      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, 'commands');
    const commandCategories = [
      'games',
      'economy',
      'leveling',
      'fun',
      'utility',
    ];

    for (const category of commandCategories) {
      const categoryPath = path.join(commandsPath, category);

      if (!fs.existsSync(categoryPath)) {
        continue;
      }

      const commandFiles = fs
        .readdirSync(categoryPath)
        .filter((file) => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(categoryPath, file);
        const command: Command = require(filePath).default;

        if ('data' in command && 'execute' in command) {
          this.commands.set(command.data.name, command);
          logger.info(`Loaded command: ${command.data.name} (${category})`);
        } else {
          logger.warn(
            `Warning: Command at ${filePath} is missing required "data" or "execute" property.`
          );
        }
      }
    }

    logger.info(`Loaded ${this.commands.size} commands`);
  }

  private async loadEvents(): Promise<void> {
    const eventsPath = path.join(__dirname, 'events');

    if (!fs.existsSync(eventsPath)) {
      logger.warn('Events directory not found, skipping event loading');
      return;
    }

    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith('.js') && file !== 'index.js');

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath).default;

      if (event.once) {
        this.once(event.name, (...args) => event.execute(...args));
      } else {
        this.on(event.name, (...args) => event.execute(...args));
      }

      logger.info(`Loaded event: ${event.name}`);
    }

    logger.info(`Loaded ${eventFiles.length} events`);
  }

  private async registerSlashCommands(): Promise<void> {
    try {
      const commands = Array.from(this.commands.values()).map((command) =>
        command.data.toJSON()
      );

      const rest = new REST({ version: '10' }).setToken(config.discord.token);

      logger.info(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      await rest.put(Routes.applicationCommands(config.discord.clientId), {
        body: commands,
      });

      logger.info(
        `Successfully reloaded ${commands.length} application (/) commands.`
      );
    } catch (error) {
      logger.error('Error registering slash commands:', error);
      throw error;
    }
  }
}
