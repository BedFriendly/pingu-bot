import { UserDto } from '../../../user/dto/UserDto';

/**
 * 코인 전송 응답 DTO
 * Service → Command 레이어 데이터 전송용
 */
export class CoinTransferResDto {
  readonly sender: Pick<UserDto, 'userId' | 'username' | 'coins'>;
  readonly receiver: Pick<UserDto, 'userId' | 'username' | 'coins'>;
  readonly amount: number;
  readonly timestamp: Date;

  constructor(props: {
    sender: Pick<UserDto, 'userId' | 'username' | 'coins'>;
    receiver: Pick<UserDto, 'userId' | 'username' | 'coins'>;
    amount: number;
  }) {
    this.sender = props.sender;
    this.receiver = props.receiver;
    this.amount = props.amount;
    this.timestamp = new Date();
  }
}
