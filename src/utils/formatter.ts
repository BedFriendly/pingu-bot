import { CONSTANTS } from '../config/constants';

export class Formatter {
  /**
   * Format a number as currency (Pingu Coins)
   */
  static coins(amount: number): string {
    return `${CONSTANTS.EMOJI.COIN} ${amount.toLocaleString()} PC`;
  }

  /**
   * Format a level with emoji
   */
  static level(level: number): string {
    return `${CONSTANTS.EMOJI.STAR} Level ${level}`;
  }

  /**
   * Format a progress bar
   */
  static progressBar(
    current: number,
    max: number,
    length: number = 10
  ): string {
    const percentage = Math.min(current / max, 1);
    const filled = Math.floor(percentage * length);
    const empty = length - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percent = (percentage * 100).toFixed(1);

    return `${bar} ${percent}%`;
  }

  /**
   * Format XP with current and required
   */
  static xp(current: number, required: number): string {
    return `${current.toLocaleString()} / ${required.toLocaleString()} XP`;
  }

  /**
   * Format a timestamp relative to now
   */
  static relativeTime(timestamp: Date): string {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }

  /**
   * Format time remaining in human-readable format
   */
  static timeRemaining(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0)
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}
