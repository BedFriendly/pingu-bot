import { IUserRepository } from '../../repository/IUserRepository';
import { UserRepository } from '../../repository/impl/UserRepository';
import { CoinTransferReqDto } from './dto/request/CoinTransferReqDto';
import { DailyRewardReqDto } from './dto/request/DailyRewardReqDto';
import { UserBalanceReqDto } from './dto/request/UserBalanceReqDto';
import { CoinTransferResDto } from './dto/response/CoinTransferResDto';
import { DailyRewardResDto } from './dto/response/DailyRewardResDto';
import { UserBalanceResDto } from './dto/response/UserBalanceResDto';
import { logger } from '../../utils/logger';

/**
 * Economy Service
 * 경제 시스템 비즈니스 로직 처리
 */
export class EconomyService {
  private readonly DAILY_REWARD_AMOUNT = 100; // 일일 보상 금액
  private readonly DAILY_COOLDOWN_HOURS = 24; // 일일 보상 쿨다운 (시간)
  private readonly MIN_TRANSFER_AMOUNT = 10; // 최소 전송 금액

  constructor(private userRepository: IUserRepository = new UserRepository()) {}

  /**
   * 사용자 잔액 조회
   */
  async getBalance(reqDto: UserBalanceReqDto): Promise<UserBalanceResDto> {
    const { userId, username } = reqDto;
    const user = await this.userRepository.findOrCreate(userId, username);

    return new UserBalanceResDto({
      user: {
        userId: user.userId,
        username: user.username,
        coins: user.coins,
        level: user.level,
      },
    });
  }

  /**
   * 코인 전송
   */
  async transferCoins(reqDto: CoinTransferReqDto): Promise<CoinTransferResDto> {
    const { fromUserId, fromUsername, toUserId, toUsername, amount } = reqDto;

    // 비즈니스 로직: 자기 자신에게 전송 방지
    if (fromUserId === toUserId) {
      throw new Error('자기 자신에게 코인을 전송할 수 없습니다.');
    }

    // 비즈니스 로직: 최소 전송 금액 검증
    if (amount < this.MIN_TRANSFER_AMOUNT) {
      throw new Error(`최소 전송 금액은 ${this.MIN_TRANSFER_AMOUNT} PC입니다.`);
    }

    // 비즈니스 로직: 음수 금액 방지
    if (amount <= 0) {
      throw new Error('전송할 코인 양은 양수여야 합니다.');
    }

    // 사용자 생성 또는 조회
    const sender = await this.userRepository.findOrCreate(
      fromUserId,
      fromUsername
    );
    await this.userRepository.findOrCreate(toUserId, toUsername);

    // 비즈니스 로직: 잔액 검증
    if (sender.coins < amount) {
      throw new Error(
        `잔액이 부족합니다. (보유: ${sender.coins} PC, 필요: ${amount} PC)`
      );
    }

    // Repository를 통한 데이터 접근 (트랜잭션 처리)
    const result = await this.userRepository.transferCoins(
      fromUserId,
      toUserId,
      amount
    );

    logger.info('코인 전송 성공:', {
      from: fromUserId,
      to: toUserId,
      amount,
    });

    return new CoinTransferResDto({
      sender: {
        userId: result.sender.userId,
        username: result.sender.username,
        coins: result.sender.coins,
      },
      receiver: {
        userId: result.receiver.userId,
        username: result.receiver.username,
        coins: result.receiver.coins,
      },
      amount,
    });
  }

  /**
   * 일일 보상 지급
   */
  async claimDailyReward(
    reqDto: DailyRewardReqDto
  ): Promise<DailyRewardResDto> {
    const { userId, username } = reqDto;

    // 사용자 생성 또는 조회
    const user = await this.userRepository.findOrCreate(userId, username);

    // 비즈니스 로직: 쿨다운 검증
    if (user.lastDaily) {
      const cooldownMs = this.DAILY_COOLDOWN_HOURS * 60 * 60 * 1000;
      const nextClaimTime = new Date(user.lastDaily.getTime() + cooldownMs);
      const now = new Date();

      if (now < nextClaimTime) {
        const remainingMs = nextClaimTime.getTime() - now.getTime();
        const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
        const remainingMinutes = Math.floor(
          (remainingMs % (60 * 60 * 1000)) / (60 * 1000)
        );

        throw new Error(
          `일일 보상은 ${remainingHours}시간 ${remainingMinutes}분 후에 다시 받을 수 있습니다.`
        );
      }
    }

    // 코인 지급 및 lastDaily 업데이트
    const updatedUser = await this.userRepository.updateUser(userId, {
      coins: user.coins + this.DAILY_REWARD_AMOUNT,
      lastDaily: new Date(),
    });

    const nextClaimTime = new Date(
      updatedUser.lastDaily!.getTime() +
        this.DAILY_COOLDOWN_HOURS * 60 * 60 * 1000
    );

    logger.info('일일 보상 지급:', {
      userId,
      amount: this.DAILY_REWARD_AMOUNT,
    });

    return new DailyRewardResDto({
      user: {
        userId: updatedUser.userId,
        username: updatedUser.username,
        coins: updatedUser.coins,
      },
      rewardAmount: this.DAILY_REWARD_AMOUNT,
      nextClaimTime,
    });
  }
}
