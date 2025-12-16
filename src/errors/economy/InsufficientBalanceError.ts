import { BotError } from '../base/BotError';

/**
 * 잔액 부족 오류
 * 사용자가 보유한 코인보다 많은 금액을 사용하려 할 때 발생
 */
export class InsufficientBalanceError extends BotError {
  constructor(
    message: string,
    public readonly required: number,
    public readonly available: number
  ) {
    super(message);
  }
}
