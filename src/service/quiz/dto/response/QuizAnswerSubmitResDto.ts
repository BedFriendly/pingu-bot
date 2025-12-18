/**
 * 퀴즈 정답 제출 응답 DTO
 */
export class QuizAnswerSubmitResDto {
  readonly isCorrect: boolean;
  readonly correctAnswer?: string;
  readonly coinsEarned: number;

  constructor(props: {
    isCorrect: boolean;
    correctAnswer?: string;
    coinsEarned: number;
  }) {
    this.isCorrect = props.isCorrect;
    this.correctAnswer = props.correctAnswer;
    this.coinsEarned = props.coinsEarned;
  }
}
