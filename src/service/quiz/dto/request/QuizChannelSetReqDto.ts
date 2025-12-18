/**
 * 퀴즈 채널 설정 요청 DTO
 */
export class QuizChannelSetReqDto {
  readonly guildId: string;
  readonly channelId: string;

  constructor(props: { guildId: string; channelId: string }) {
    this.guildId = props.guildId;
    this.channelId = props.channelId;
  }
}
