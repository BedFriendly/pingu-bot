/**
 * 퀴즈 채널 설정 응답 DTO
 */
export class QuizChannelSetResDto {
  readonly guildId: string;
  readonly quizChannelId: string;

  constructor(props: { guildId: string; quizChannelId: string }) {
    this.guildId = props.guildId;
    this.quizChannelId = props.quizChannelId;
  }
}
