import { BotError } from '../base/BotError';

/**
 * 쿨다운 오류
 * 사용자가 쿨다운 시간이 지나지 않았을 때 발생
 */
export class DailyCooldownError extends BotError {
  constructor(
    message: string,
    public readonly remainingHours: number,
    public readonly remainingMinutes: number
  ) {
    super(message);
  }
}
