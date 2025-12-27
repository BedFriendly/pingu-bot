/**
 * 사용자 경험치 추가 요청 DTO
 * Event → Service 레이어 데이터 전송용
 */
export class UserXpAddReqDto {
  readonly userId: string;
  readonly username: string;

  constructor(props: { userId: string; username: string }) {
    this.userId = props.userId;
    this.username = props.username;
  }
}
