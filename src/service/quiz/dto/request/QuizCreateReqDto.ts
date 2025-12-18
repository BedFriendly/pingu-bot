import { QuizType } from '../../../../types/quiz';

/**
 * 퀴즈 생성 요청 DTO
 */
export class QuizCreateReqDto {
  readonly guildId: string;
  readonly quizType?: QuizType;

  constructor(props: { guildId: string; quizType?: QuizType }) {
    this.guildId = props.guildId;
    this.quizType = props.quizType;
  }
}
