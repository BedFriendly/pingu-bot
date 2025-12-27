import { UserDto } from '../../../user/dto/UserDto';

/**
 * 사용자 레벨업 응답 DTO
 * Service → Command 레이어 데이터 전송용
 */
export class UserLevelUpResDto {
  readonly user: Pick<
    UserDto,
    'userId' | 'username' | 'level' | 'experience' | 'coins'
  >;
  readonly oldLevel: number;
  readonly newLevel: number;
  readonly coinReward: number;

  constructor(props: {
    user: Pick<
      UserDto,
      'userId' | 'username' | 'level' | 'experience' | 'coins'
    >;
    oldLevel: number;
    newLevel: number;
    coinReward: number;
  }) {
    this.user = props.user;
    this.oldLevel = props.oldLevel;
    this.newLevel = props.newLevel;
    this.coinReward = props.coinReward;
  }
}
