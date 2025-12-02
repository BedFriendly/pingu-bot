import { PinguBot } from './bot';

const bot = new PinguBot();

// Global error handlers
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled promise rejection:', error);
  console.error(error.stack);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception:', error);
  console.error(error.stack);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  bot.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  bot.destroy();
  process.exit(0);
});

// Start the bot
bot.start().catch((error) => {
  console.error('Fatal error during bot startup:', error);
  process.exit(1);
});
