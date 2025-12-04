import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

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
  environment: 'development' | 'production';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
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
  environment:
    (process.env.NODE_ENV as 'development' | 'production') || 'development',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
};
