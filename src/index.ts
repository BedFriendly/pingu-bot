import { PinguBot } from './bot';
import { logger } from './utils/logger';

const bot = new PinguBot();

// Global error handlers
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  bot.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  bot.destroy();
  process.exit(0);
});

// Start the bot
bot.start().catch((error) => {
  logger.error('Fatal error during bot startup:', error);
  process.exit(1);
});
