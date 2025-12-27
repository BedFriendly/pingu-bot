import { UserDto } from '../../../user/dto/UserDto';

/**
 * 사용자 레벨 정보 응답 DTO
 * Service → Command 레이어 데이터 전송용
 */
export class UserLevelInfoResDto {
  readonly user: Pick<UserDto, 'userId' | 'username' | 'level' | 'experience'>;
  readonly currentXp: number;
  readonly requiredXp: number;
  readonly progress: number; // 0-100

  constructor(props: {
    user: Pick<UserDto, 'userId' | 'username' | 'level' | 'experience'>;
    currentXp: number;
    requiredXp: number;
    progress: number;
  }) {
    this.user = props.user;
    this.currentXp = props.currentXp;
    this.requiredXp = props.requiredXp;
    this.progress = props.progress;
  }
}
