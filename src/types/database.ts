export interface User {
  user_id: string;
  username: string;
  coins: number;
  experience: number;
  level: number;
  total_wins: number;
  total_games: number;
  last_daily: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Guild {
  guild_id: string;
  guild_name: string;
  prefix: string;
  level_channel_id: string | null;
  welcome_channel_id: string | null;
  language: string;
  created_at: Date;
  updated_at: Date;
}

export interface GameStats {
  id: number;
  user_id: string;
  game_type: 'rps' | 'coinflip' | 'guess' | 'dice';
  result: 'win' | 'loss' | 'draw';
  bet_amount: number;
  profit: number;
  played_at: Date;
}

export interface Cooldown {
  id: number;
  user_id: string;
  command_name: string;
  expires_at: Date;
}
