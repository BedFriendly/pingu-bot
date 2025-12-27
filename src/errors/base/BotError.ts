/**
 * 봇 비즈니스 로직 오류 기본 클래스
 * Service layer에서 발생하는 예상 가능한 오류
 *
 * @remarks
 * BotError는 사용자에게 직접 표시할 수 있는 오류입니다.
 * 시스템 오류(DatabaseError, NetworkError 등)와 구분됩니다.
 */
export class BotError extends Error {
  /**
   * 이 오류가 예상 가능한 운영 오류인지 여부
   * true인 경우 사용자에게 오류 메시지를 직접 표시할 수 있습니다.
   */
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // V8 환경에서 스택 트레이스를 올바르게 캡처
    Error.captureStackTrace(this, this.constructor);
  }
}
