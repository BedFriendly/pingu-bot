import { BotError } from '../../base/BotError';

/**
 * 퀴즈 세션을 찾을 수 없는 오류
 * 퀴즈가 이미 종료되었거나 존재하지 않을 때 발생
 */
export class QuizNotFoundError extends BotError {
  constructor(message: string) {
    super(message);
  }
}
