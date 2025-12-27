import { BotError } from '../../base/BotError';

/**
 * 퀴즈 채널이 설정되지 않은 오류
 * 퀴즈 설정이 없거나 채널이 지정되지 않았을 때 발생
 */
export class QuizChannelNotSetError extends BotError {
  constructor(message: string) {
    super(message);
  }
}
