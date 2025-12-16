import { UserDto } from '../../../user/dto/UserDto';

/**
 * 일일 보상 응답 DTO
 * Service → Command 레이어 데이터 전송용
 */
export class DailyRewardResDto {
  readonly user: Pick<UserDto, 'userId' | 'username' | 'coins'>;
  readonly rewardAmount: number;
  readonly nextClaimTime: Date;

  constructor(props: {
    user: Pick<UserDto, 'userId' | 'username' | 'coins'>;
    rewardAmount: number;
    nextClaimTime: Date;
  }) {
    this.user = props.user;
    this.rewardAmount = props.rewardAmount;
    this.nextClaimTime = props.nextClaimTime;
  }
}
