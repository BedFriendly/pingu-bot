export const CONSTANTS = {
  // Economy
  DAILY_REWARD_MIN: 100,
  DAILY_REWARD_MAX: 500,
  DAILY_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

  // Leveling
  XP_PER_MESSAGE: 15,
  XP_RANGE: 10, // 15-25 XP range
  MESSAGE_COOLDOWN: 60 * 1000, // 60 seconds in milliseconds
  LEVEL_UP_COIN_MULTIPLIER: 100, // level * 100 coins

  // Games
  COINFLIP_MULTIPLIER: 2,
  RPS_MULTIPLIER: 2,
  MIN_BET: 10,

  // Embed Colors
  COLORS: {
    SUCCESS: 0x57f287,
    ERROR: 0xed4245,
    WARNING: 0xfee75c,
    INFO: 0x5865f2,
    ECONOMY: 0xfee75c,
    GAME: 0x57f287,
    LEVEL: 0x5865f2,
  },

  // Emoji
  EMOJI: {
    COIN: '🪙',
    LEVEL_UP: '⬆️',
    STAR: '⭐',
    TROPHY: '🏆',
    PENGUIN: '🐧',
    DICE: '🎲',
    GAME: '🎮',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
  },
} as const;
