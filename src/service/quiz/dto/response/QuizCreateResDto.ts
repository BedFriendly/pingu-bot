/**
 * 퀴즈 생성 응답 DTO
 */
export class QuizCreateResDto {
  readonly session: {
    id: number;
    quizType: string;
    question: string;
    hint?: string;
    difficulty: number;
    timeLimit: number;
    rewardAmount: number;
    answer: string; // Collector용
  };
  readonly channelId: string;

  constructor(props: {
    session: {
      id: number;
      quizType: string;
      question: string;
      hint?: string;
      difficulty: number;
      timeLimit: number;
      rewardAmount: number;
      answer: string;
    };
    channelId: string;
  }) {
    this.session = props.session;
    this.channelId = props.channelId;
  }
}
