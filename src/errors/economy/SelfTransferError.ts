import { BotError } from '../base/BotError';

/**
 * 자기 자신에게 전송 오류
 * 사용자가 자기 자신에게 코인을 전송하려 할 때 발생
 */
export class SelfTransferError extends BotError {
  constructor(message: string) {
    super(message);
  }
}
