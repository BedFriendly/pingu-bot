/**
 * 코인 전송 요청 DTO
 * Command → Service 레이어 데이터 전송용
 */
export class CoinTransferReqDto {
  readonly fromUserId: string;
  readonly fromUsername: string;
  readonly toUserId: string;
  readonly toUsername: string;
  readonly amount: number;

  constructor(props: {
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    toUsername: string;
    amount: number;
  }) {
    this.fromUserId = props.fromUserId;
    this.fromUsername = props.fromUsername;
    this.toUserId = props.toUserId;
    this.toUsername = props.toUsername;
    this.amount = props.amount;
  }
}
