/**
 * 사용자 잔액 조회 요청 DTO
 * Command → Service 레이어 데이터 전송용
 */
export class UserBalanceReqDto {
  readonly userId: string;
  readonly username: string;

  constructor(props: { userId: string; username: string }) {
    this.userId = props.userId;
    this.username = props.username;
  }
}
