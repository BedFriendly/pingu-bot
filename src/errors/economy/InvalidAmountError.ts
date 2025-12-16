import { BotError } from '../base/BotError';

/**
 * 잘못된 금액 오류
 * 음수 금액이거나 최소 금액 미만일 때 발생
 */
export class InvalidAmountError extends BotError {
  constructor(
    message: string,
    public readonly reason: 'negative' | 'below-minimum',
    public readonly minAmount?: number
  ) {
    super(message);
  }
}
