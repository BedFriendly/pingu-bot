import { IUserRepository } from '../../repository/IUserRepository';
import { UserRepository } from '../../repository/impl/UserRepository';
import { UserLevelInfoReqDto } from './dto/request/UserLevelInfoReqDto';
import { UserXpAddReqDto } from './dto/request/UserXpAddReqDto';
import { UserLevelUpResDto } from './dto/response/UserLevelUpResDto';
import { UserLevelInfoResDto } from './dto/response/UserLevelInfoResDto';
import { logger } from '../../utils/logger';

/**
 * Leveling Service
 * 레벨링 시스템 비즈니스 로직 처리
 */
export class LevelingService {
  private readonly MIN_XP_GAIN = 15; // 메시지당 최소 XP
  private readonly MAX_XP_GAIN = 25; // 메시지당 최대 XP
  private readonly COIN_REWARD_PER_LEVEL = 100; // 레벨당 코인 보상

  constructor(private userRepository: IUserRepository = new UserRepository()) {}

  /**
   * 레벨 정보 조회
   */
  async getLevelInfo(
    reqDto: UserLevelInfoReqDto
  ): Promise<UserLevelInfoResDto> {
    const { userId, username } = reqDto;
    const user = await this.userRepository.findOrCreate(userId, username);

    // 비즈니스 로직: 현재 레벨 필요 경험치 계산
    const requiredXp = this.calculateRequiredXp(user.level);
    const currentXp = user.experience;

    // 비즈니스 로직: 진행률 계산
    const prevLevelXp =
      user.level > 1 ? this.calculateRequiredXp(user.level - 1) : 0;
    const progress = Math.floor(
      ((currentXp - prevLevelXp) / (requiredXp - prevLevelXp)) * 100
    );

    return new UserLevelInfoResDto({
      user: {
        userId: user.userId,
        username: user.username,
        level: user.level,
        experience: user.experience,
      },
      currentXp,
      requiredXp,
      progress: Math.max(0, Math.min(100, progress)),
    });
  }

  /**
   * 경험치 추가 (메시지 작성 시)
   * @returns 레벨업이 발생하면 UserLevelUpResDto, 아니면 null
   */
  async addExperience(
    reqDto: UserXpAddReqDto
  ): Promise<UserLevelUpResDto | null> {
    const { userId, username } = reqDto;
    const user = await this.userRepository.findOrCreate(userId, username);

    // 비즈니스 로직: 랜덤 경험치 계산
    const xpGain =
      Math.floor(Math.random() * (this.MAX_XP_GAIN - this.MIN_XP_GAIN + 1)) +
      this.MIN_XP_GAIN;

    const newXp = user.experience + xpGain;
    let newLevel = user.level;
    let leveledUp = false;

    // 비즈니스 로직: 레벨업 계산
    while (newXp >= this.calculateRequiredXp(newLevel)) {
      newLevel++;
      leveledUp = true;
    }

    // 비즈니스 로직: 레벨업 보상 계산
    const coinReward = leveledUp
      ? (newLevel - user.level) * this.COIN_REWARD_PER_LEVEL
      : 0;

    // Repository를 통한 데이터 업데이트
    const updatedUser = await this.userRepository.updateUser(userId, {
      experience: newXp,
      level: newLevel,
      coins: user.coins + coinReward,
    });

    // 레벨업이 발생한 경우에만 응답 DTO 반환
    if (leveledUp) {
      logger.info('레벨업 발생:', {
        userId,
        oldLevel: user.level,
        newLevel,
        coinReward,
      });

      return new UserLevelUpResDto({
        user: {
          userId: updatedUser.userId,
          username: updatedUser.username,
          level: updatedUser.level,
          experience: updatedUser.experience,
          coins: updatedUser.coins,
        },
        oldLevel: user.level,
        newLevel,
        coinReward,
      });
    }

    return null;
  }

  /**
   * 비즈니스 로직: 레벨별 필요 경험치 계산
   * XP = 100 * level^1.5
   */
  private calculateRequiredXp(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }
}
