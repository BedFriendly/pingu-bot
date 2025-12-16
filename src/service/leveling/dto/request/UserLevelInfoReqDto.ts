/**
 * 사용자 레벨 정보 조회 요청 DTO
 * Command → Service 레이어 데이터 전송용
 */
export class UserLevelInfoReqDto {
  readonly userId: string;
  readonly username: string;

  constructor(props: { userId: string; username: string }) {
    this.userId = props.userId;
    this.username = props.username;
  }
}
