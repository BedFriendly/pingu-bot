import { BotError } from '../../base/BotError';

/**
 * 이미 활성화된 퀴즈가 존재하는 오류
 * 길드에 이미 진행 중인 퀴즈가 있을 때 발생
 */
export class QuizAlreadyActiveError extends BotError {
  constructor(message: string) {
    super(message);
  }
}
