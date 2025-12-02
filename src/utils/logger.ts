import { config } from '../config/config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

class Logger {
  private level: number;

  constructor() {
    this.level = LOG_LEVELS[config.logLevel];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= this.level;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelTag = level.toUpperCase().padEnd(5);
    let formatted = `[${timestamp}] [${levelTag}] ${message}`;

    if (data) {
      formatted += `\n${JSON.stringify(data, null, 2)}`;
    }

    return formatted;
  }

  error(message: string, error?: Error | any): void {
    if (!this.shouldLog('error')) return;

    const formatted = this.formatMessage('error', message);
    console.error(`${COLORS.red}${formatted}${COLORS.reset}`);

    if (error) {
      if (error instanceof Error) {
        console.error(error.stack);
      } else {
        console.error(error);
      }
    }
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;

    const formatted = this.formatMessage('warn', message, data);
    console.warn(`${COLORS.yellow}${formatted}${COLORS.reset}`);
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.formatMessage('info', message, data);
    console.log(`${COLORS.blue}${formatted}${COLORS.reset}`);
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage('debug', message, data);
    console.log(`${COLORS.gray}${formatted}${COLORS.reset}`);
  }
}

export const logger = new Logger();
