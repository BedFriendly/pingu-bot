import { UserDto } from '../../../user/dto/UserDto';

/**
 * 사용자 잔액 조회 응답 DTO
 * Service → Command 레이어 데이터 전송용
 */
export class UserBalanceResDto {
  readonly user: Pick<UserDto, 'userId' | 'username' | 'coins' | 'level'>;

  constructor(props: {
    user: Pick<UserDto, 'userId' | 'username' | 'coins' | 'level'>;
  }) {
    this.user = props.user;
  }
}
