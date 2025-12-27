/**
 * 퀴즈 정답 제출 요청 DTO
 */
export class QuizAnswerSubmitReqDto {
  readonly quizSessionId: number;
  readonly userId: string;
  readonly username: string;
  readonly answer: string;

  constructor(props: {
    quizSessionId: number;
    userId: string;
    username: string;
    answer: string;
  }) {
    this.quizSessionId = props.quizSessionId;
    this.userId = props.userId;
    this.username = props.username;
    this.answer = props.answer;
  }
}
