/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

type NodeEnv = 'development' | 'production';
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface Config {
  discord: {
    token: string;
    clientId: string;
  };
  database: {
    path: string;
  };
  apis: {
    unsplashAccessKey: string;
  };
  quiz: {
    generationCron: string;
    timeLimit: number; // 밀리초
  };
  environment: NodeEnv;
  logLevel: LogLevel;
}

function validateEnv(): void {
  const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

validateEnv();

export const config: Config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  database: {
    path:
      process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'pingu.db'),
  },
  apis: {
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  },
  quiz: {
    generationCron: process.env.QUIZ_GENERATION_CRON || '*/5 * * * *', // 기본값: 5분마다
    timeLimit: parseInt(process.env.QUIZ_TIME_LIMIT || '180000'), // 기본값: 3분 (밀리초)
  },
  environment: (process.env.NODE_ENV as NodeEnv) || 'development',
  logLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
};
