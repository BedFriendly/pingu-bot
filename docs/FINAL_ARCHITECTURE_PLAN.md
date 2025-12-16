# Pingu Bot - 최종 아키텍처 마이그레이션 계획

## 목표

기존 **pg + Model** 구조를 **Prisma + DTO + DAO + Repository + Service** 5계층 아키텍처로 전환:

- ✅ **DTO**: 계층 간 타입 안전한 데이터 전송 (도메인별 관리)
- ✅ **DAO**: 1 테이블 = 1 DAO, 순수 CRUD (database 폴더 내)
- ✅ **Repository**: 여러 DAO 조합, 데이터 접근만 담당
- ✅ **Service**: 모든 비즈니스 로직 처리 (도메인별 관리)
- ✅ **Prisma**: Type-safe ORM

---

## 최종 디렉토리 구조

```
src/
├── database/                     # 데이터베이스 계층
│   ├── dao/                      # DAO 인터페이스
│   │   ├── IUserDAO.ts
│   │   ├── IGuildDAO.ts
│   │   ├── IGameStatDAO.ts
│   │   ├── impl/                 # DAO 구현체
│   │   │   ├── UserDAO.ts
│   │   │   ├── GuildDAO.ts
│   │   │   └── GameStatDAO.ts
│   │   └── index.ts
│   ├── prisma.ts                 # Prisma Client 싱글톤
│   └── index.ts
│
├── repository/                   # Repository 계층
│   ├── IUserRepository.ts        # Repository 인터페이스
│   ├── IGuildRepository.ts
│   ├── impl/                     # Repository 구현체
│   │   ├── UserRepository.ts
│   │   └── GuildRepository.ts
│   └── index.ts
│
├── service/                      # Service 계층 (도메인별)
│   ├── user/                     # User 도메인
│   │   ├── user.service.ts       # User Service
│   │   └── dto/                  # User DTO
│   │       ├── UserDto.ts        # Entity DTO
│   │       ├── request/          # Request DTOs
│   │       │   └── UserCreateReqDto.ts
│   │       └── response/         # Response DTOs
│   │           └── UserInfoResDto.ts
│   │
│   ├── economy/                  # Economy 도메인
│   │   ├── economy.service.ts
│   │   └── dto/
│   │       ├── request/
│   │       │   └── CoinTransferReqDto.ts
│   │       └── response/
│   │           ├── CoinTransferResDto.ts
│   │           ├── UserBalanceResDto.ts
│   │           └── UserLeaderboardResDto.ts
│   │
│   ├── leveling/                 # Leveling 도메인
│   │   ├── leveling.service.ts
│   │   └── dto/
│   │       └── response/
│   │           └── UserLevelUpResDto.ts
│   │
│   └── index.ts
│
├── embed/                       # Embed 계층 (Command별)
│   ├── balance/                 # balance 명령어용 Embed
│   │   └── UserBalanceEmbed.ts
│   ├── pay/                     # pay 명령어용 Embed
│   │   └── CoinTransferEmbed.ts
│   ├── daily/                   # daily 명령어용 Embed
│   │   └── DailyRewardEmbed.ts
│   └── index.ts
│
├── command/                     # Command 계층
│   ├── economy/
│   │   ├── balance.ts
│   │   ├── pay.ts
│   │   └── daily.ts
│   └── ...
│
└── ...
```

---

## 폴더 구조 설계 원칙

### 1. DAO - database 폴더 내부

```
database/
├── dao/
│   ├── IUserDAO.ts          # 인터페이스
│   └── impl/
│       └── UserDAO.ts       # 구현체
```

**이유**: DAO는 데이터베이스 접근 계층이므로 database 폴더 내에 위치

### 2. Service - 도메인별 관리

```
service/
├── user/
│   ├── user.service.ts      # User 관련 비즈니스 로직
│   └── dto/
│       ├── UserDto.ts       # Entity DTO (직접)
│       ├── request/         # Request DTOs
│       └── response/        # Response DTOs
```

**이유**:

- 도메인별로 응집도 높은 구조
- DTO가 Service와 같은 위치에 있어 관리 용이
- 도메인 경계가 명확

### 3. Repository - impl 폴더로 구현체 분리

```
repository/
├── IUserRepository.ts       # 인터페이스
└── impl/
    └── UserRepository.ts    # 구현체
```

**이유**: 인터페이스와 구현체를 분리하여 의존성 역전 원칙 준수

### 4. Embed - Command별 관리

```text
embed/
├── balance/
│   └── UserBalanceEmbed.ts    # balance 명령어용 Embed
├── pay/
│   └── CoinTransferEmbed.ts   # pay 명령어용 Embed
```

**이유**:

- Embed는 명령어의 응답 형식이므로 Command와 가까운 위치
- Command별로 분리하여 관리 용이
- Embed 생성 로직과 Command 로직 분리

**규칙**:

- **네이밍**: `{Data}{Action}Embed` (Upper Camel Case)
  - 예: `UserBalanceEmbed`, `CoinTransferEmbed`, `DailyRewardEmbed`
- **호출**: Command에서만 호출 (Service에서 호출 금지)
- **역할**: Props를 받아서 EmbedBuilder 객체만 생성 (전송은 Command가 담당)

---

## 계층별 Import 예시

### Command → Service + Embed

```typescript
// src/command/economy/pay.ts
import { EconomyService } from '../../service/economy/economy.service';
import { CoinTransferReqDto } from '../../service/economy/dto/request/CoinTransferReqDto';
import { CoinTransferEmbed } from '../../embed/pay/CoinTransferEmbed';
```

### Service → Repository

```typescript
// src/service/economy/economy.service.ts
import { IUserRepository } from '../../repository/IUserRepository';
import { UserRepository } from '../../repository/impl/UserRepository';
```

### Repository → DAO

```typescript
// src/repository/impl/UserRepository.ts
import { IUserDAO } from '../../database/dao/IUserDAO';
import { UserDAO } from '../../database/dao/impl/UserDAO';
```

### DAO → Prisma

```typescript
// src/database/dao/impl/UserDAO.ts
import { prisma } from '../../prisma';
```

---

## DTO 배치 예시

### User 도메인 DTO

```
service/user/dto/
├── UserDto.ts                    # Entity DTO
├── request/
│   └── UserCreateReqDto.ts
└── response/
    └── UserInfoResDto.ts
```

### Economy 도메인 DTO

```
service/economy/dto/
├── request/
│   ├── CoinTransferReqDto.ts
│   └── DailyRewardReqDto.ts
└── response/
    ├── CoinTransferResDto.ts
    ├── UserBalanceResDto.ts
    ├── DailyRewardResDto.ts
    └── UserLeaderboardResDto.ts
```

### Leveling 도메인 DTO

```
service/leveling/dto/
└── response/
    ├── UserLevelUpResDto.ts
    └── UserLevelInfoResDto.ts
```

---

## 파일 경로 예시

### DAO

```typescript
// 인터페이스
src / database / dao / IUserDAO.ts;

// 구현체
src / database / dao / impl / UserDAO.ts;

// Export
src / database / dao / index.ts;
```

### Repository

```typescript
// 인터페이스
src / repository / IUserRepository.ts;

// 구현체
src / repository / impl / UserRepository.ts;

// Export
src / repository / index.ts;
```

### Service & DTO

```typescript
// Service
src / service / economy / economy.service.ts;

// Request DTO
src / service / economy / dto / request / CoinTransferReqDto.ts;

// Response DTO
src / service / economy / dto / response / CoinTransferResDto.ts;

// Export
src / service / index.ts;
src / service / economy / index.ts;
```

---

## 주요 파일 예시

### 1. DAO 인터페이스

**파일: `src/database/dao/IUserDAO.ts`**

```typescript
import { User, Prisma } from '@prisma/client';

export interface IUserDAO {
  findById(userId: string): Promise<User | null>;
  findMany(
    where?: Prisma.UserWhereInput,
    orderBy?: Prisma.UserOrderByWithRelationInput[]
  ): Promise<User[]>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(userId: string, data: Prisma.UserUpdateInput): Promise<User>;
  upsert(
    userId: string,
    createData: Prisma.UserCreateInput,
    updateData: Prisma.UserUpdateInput
  ): Promise<User>;
  delete(userId: string): Promise<void>;
  incrementCoins(userId: string, amount: number): Promise<User>;
  decrementCoins(userId: string, amount: number): Promise<User>;
}
```

### 2. DAO 구현체

**파일: `src/database/dao/impl/UserDAO.ts`**

```typescript
import { IUserDAO } from '../IUserDAO';
import { User, Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { logger } from '../../../utils/logger';

export class UserDAO implements IUserDAO {
  async findById(userId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { user_id: userId } });
    } catch (error) {
      logger.error('[UserDAO] findById 실패:', { userId, error });
      throw error;
    }
  }

  // ... 나머지 메서드
}
```

### 3. Repository 인터페이스

**파일: `src/repository/IUserRepository.ts`**

```typescript
import { User } from '@prisma/client';

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findOrCreate(userId: string, username: string): Promise<User>;
  addCoins(userId: string, amount: number): Promise<User>;
  transferCoins(
    fromId: string,
    toId: string,
    amount: number
  ): Promise<{
    sender: User;
    receiver: User;
  }>;
  updateUser(
    userId: string,
    data: {
      experience?: number;
      level?: number;
      coins?: number;
    }
  ): Promise<User>;
  updateDaily(userId: string): Promise<User>;
  getLeaderboardByCoins(limit: number): Promise<User[]>;
  getLeaderboardByLevel(limit: number): Promise<User[]>;
  getLeaderboardByWins(limit: number): Promise<User[]>;
}
```

### 4. Repository 구현체

**파일: `src/repository/impl/UserRepository.ts`**

```typescript
import { IUserRepository } from '../IUserRepository';
import { IUserDAO } from '../../database/dao/IUserDAO';
import { UserDAO } from '../../database/dao/impl/UserDAO';
import { User } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { logger } from '../../utils/logger';

export class UserRepository implements IUserRepository {
  constructor(private userDAO: IUserDAO = new UserDAO()) {}

  async findById(userId: string): Promise<User | null> {
    return this.userDAO.findById(userId);
  }

  async findOrCreate(userId: string, username: string): Promise<User> {
    return this.userDAO.upsert(userId, { user_id: userId, username }, {});
  }

  // ... 나머지 메서드 (비즈니스 로직 없음, 데이터 접근만)
}
```

### 5. Entity DTO

**파일: `src/service/user/dto/UserDto.ts`**

```typescript
import { User } from '@prisma/client';

/**
 * User Entity DTO
 * Response DTO에서만 사용
 */
export class UserDto {
  readonly user_id: string;
  readonly username: string;
  readonly coins: number;
  readonly experience: number;
  readonly level: number;
  readonly total_wins: number;
  readonly total_games: number;
  readonly last_daily: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(data: {
    user_id: string;
    username: string;
    coins: number;
    experience: number;
    level: number;
    total_wins: number;
    total_games: number;
    last_daily: Date | null;
    created_at: Date;
    updated_at: Date;
  }) {
    this.user_id = data.user_id;
    this.username = data.username;
    this.coins = data.coins;
    this.experience = data.experience;
    this.level = data.level;
    this.total_wins = data.total_wins;
    this.total_games = data.total_games;
    this.last_daily = data.last_daily;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static fromEntity(user: User): UserDto {
    return new UserDto(user);
  }
}
```

### 6. Request DTO

**파일: `src/service/economy/dto/request/CoinTransferReqDto.ts`**

```typescript
export class CoinTransferReqDto {
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly amount: number;

  constructor(data: { fromUserId: string; toUserId: string; amount: number }) {
    this.fromUserId = data.fromUserId;
    this.toUserId = data.toUserId;
    this.amount = data.amount;
  }
}
```

### 7. Response DTO

**파일: `src/service/economy/dto/response/CoinTransferResDto.ts`**

```typescript
import { UserDto } from '../../../user/dto/UserDto';

export class CoinTransferResDto {
  readonly success: boolean;
  readonly sender: Pick<UserDto, 'user_id' | 'username' | 'coins'>;
  readonly receiver: Pick<UserDto, 'user_id' | 'username' | 'coins'>;
  readonly transferredAmount: number;

  constructor(data: {
    success: boolean;
    sender: Pick<UserDto, 'user_id' | 'username' | 'coins'>;
    receiver: Pick<UserDto, 'user_id' | 'username' | 'coins'>;
    transferredAmount: number;
  }) {
    this.success = data.success;
    this.sender = data.sender;
    this.receiver = data.receiver;
    this.transferredAmount = data.transferredAmount;
  }
}
```

### 8. Service

**파일: `src/service/economy/economy.service.ts`**

```typescript
import { IUserRepository } from '../../repository/IUserRepository';
import { UserRepository } from '../../repository/impl/UserRepository';
import { CoinTransferReqDto } from './dto/request/CoinTransferReqDto';
import { CoinTransferResDto } from './dto/response/CoinTransferResDto';
import { UserBalanceResDto } from './dto/response/UserBalanceResDto';

export class EconomyService {
  constructor(private userRepo: IUserRepository = new UserRepository()) {}

  async transferCoins(reqDto: CoinTransferReqDto): Promise<CoinTransferResDto> {
    const { fromUserId, toUserId, amount } = reqDto;

    // 비즈니스 로직: 검증
    if (amount < 10) {
      throw new Error('최소 전송 금액은 10 PC입니다.');
    }

    if (fromUserId === toUserId) {
      throw new Error('자신에게 코인을 전송할 수 없습니다.');
    }

    // 비즈니스 로직: 잔액 확인
    const sender = await this.userRepo.findById(fromUserId);
    if (!sender || sender.coins < amount) {
      throw new Error('잔액이 부족합니다.');
    }

    const receiver = await this.userRepo.findById(toUserId);
    if (!receiver) {
      throw new Error('받는 사람을 찾을 수 없습니다.');
    }

    // Repository에 데이터 접근 위임
    const result = await this.userRepo.transferCoins(
      fromUserId,
      toUserId,
      amount
    );

    // Response DTO 생성
    return new CoinTransferResDto({
      success: true,
      sender: {
        user_id: result.sender.user_id,
        username: result.sender.username,
        coins: result.sender.coins,
      },
      receiver: {
        user_id: result.receiver.user_id,
        username: result.receiver.username,
        coins: result.receiver.coins,
      },
      transferredAmount: amount,
    });
  }
}
```

### 9. Embed

**파일: `src/embed/balance/UserBalanceEmbed.ts`**

```typescript
import { EmbedBuilder } from 'discord.js';

/**
 * 잔액 조회 Embed
 * Command에서만 호출
 */
export class UserBalanceEmbed {
  /**
   * 잔액 조회 Embed 생성
   * @param props - Embed 생성에 필요한 데이터
   * @returns EmbedBuilder 객체
   */
  static create(props: { username: string; balance: number }): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('💰 잔액 조회')
      .setDescription(`**${props.username}**님의 잔액`)
      .addFields({
        name: '보유 코인',
        value: `${props.balance} PC`,
        inline: true,
      })
      .setColor(0x00ff00)
      .setTimestamp();
  }
}
```

**파일: `src/embed/pay/CoinTransferEmbed.ts`**

```typescript
import { EmbedBuilder } from 'discord.js';

export class CoinTransferEmbed {
  static create(props: {
    senderName: string;
    receiverName: string;
    amount: number;
    senderBalance: number;
    receiverBalance: number;
  }): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('💸 코인 전송 완료')
      .setDescription(`**${props.senderName}** → **${props.receiverName}**`)
      .addFields(
        {
          name: '전송 금액',
          value: `${props.amount} PC`,
          inline: true,
        },
        {
          name: '발신자 잔액',
          value: `${props.senderBalance} PC`,
          inline: true,
        },
        {
          name: '수신자 잔액',
          value: `${props.receiverBalance} PC`,
          inline: true,
        }
      )
      .setColor(0x00ff00)
      .setTimestamp();
  }
}
```

### 10. Command (Class 기반, Embed 사용)

**파일: `src/command/economy/balance.ts`**

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { EconomyService } from '../../service/economy/economy.service';
import { UserBalanceEmbed } from '../../embed/balance/UserBalanceEmbed';

/**
 * 잔액 조회 Command
 */
export default class BalanceCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('잔액을 확인합니다');

  category = 'economy' as const;

  private economyService: EconomyService;

  constructor() {
    this.economyService = new EconomyService();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Service 호출 (Response DTO 반환)
      const balanceRes = await this.economyService.getBalance(
        interaction.user.id,
        interaction.user.username
      );

      // Embed 생성 (Command에서만!)
      const embed = UserBalanceEmbed.create({
        username: balanceRes.username,
        balance: balanceRes.balance,
      });

      // 전송도 Command에서
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('잔액 조회 실패:', error);
      await interaction.reply({
        content: '잔액 조회 중 오류가 발생했습니다.',
        ephemeral: true,
      });
    }
  }
}
```

**파일: `src/command/economy/pay.ts`**

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { EconomyService } from '../../service/economy/economy.service';
import { CoinTransferReqDto } from '../../service/economy/dto/request/CoinTransferReqDto';
import { CoinTransferEmbed } from '../../embed/pay/CoinTransferEmbed';

/**
 * 코인 전송 Command
 */
export default class PayCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('pay')
    .setDescription('다른 유저에게 코인을 전송합니다')
    .addUserOption((option) =>
      option.setName('user').setDescription('전송할 유저').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('전송할 코인 양')
        .setMinValue(10)
        .setRequired(true)
    );

  category = 'economy' as const;
  cooldown = 5;

  private economyService: EconomyService;

  constructor() {
    this.economyService = new EconomyService();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);

      // Request DTO 생성
      const reqDto = new CoinTransferReqDto({
        fromUserId: interaction.user.id,
        toUserId: targetUser.id,
        amount,
      });

      // Service 호출 (Response DTO 반환)
      const transferRes = await this.economyService.transferCoins(reqDto);

      // Embed 생성 (Command에서만!)
      const embed = CoinTransferEmbed.create({
        senderName: transferRes.sender.username,
        receiverName: transferRes.receiver.username,
        amount: transferRes.transferredAmount,
        senderBalance: transferRes.sender.coins,
        receiverBalance: transferRes.receiver.coins,
      });

      // 전송도 Command에서
      await interaction.reply({ embeds: [embed] });
    } catch (error: any) {
      await interaction.reply({
        content: `❌ ${error.message}`,
        ephemeral: true,
      });
    }
  }
}
```

---

## Export 파일 예시

### `src/database/dao/index.ts`

```typescript
// Interfaces
export * from './IUserDAO';
export * from './IGuildDAO';
export * from './IGameStatDAO';

// Implementations
export * from './impl/UserDAO';
export * from './impl/GuildDAO';
export * from './impl/GameStatDAO';
```

### `src/repository/index.ts`

```typescript
// Interfaces
export * from './IUserRepository';
export * from './IGuildRepository';

// Implementations
export * from './impl/UserRepository';
export * from './impl/GuildRepository';
```

### `src/service/economy/index.ts`

```typescript
export * from './economy.service';
export * from './dto/request/CoinTransferReqDto';
export * from './dto/response/CoinTransferResDto';
export * from './dto/response/UserBalanceResDto';
```

### `src/service/index.ts`

```typescript
export * from './user';
export * from './economy';
export * from './leveling';
```

### `src/embed/balance/index.ts`

```typescript
export * from './UserBalanceEmbed';
```

### `src/embed/index.ts`

```typescript
export * from './balance';
export * from './pay';
export * from './daily';
```

---

## 마이그레이션 체크리스트

### Phase 0: Prisma 설정

- [ ] Prisma 설치
- [ ] Schema 정의
- [ ] `src/database/prisma.ts` 싱글톤 생성

### Phase 1: DAO 계층

- [ ] `src/database/dao/IUserDAO.ts`
- [ ] `src/database/dao/impl/UserDAO.ts`
- [ ] `src/database/dao/IGuildDAO.ts`
- [ ] `src/database/dao/impl/GuildDAO.ts`
- [ ] `src/database/dao/IGameStatDAO.ts`
- [ ] `src/database/dao/impl/GameStatDAO.ts`
- [ ] `src/database/dao/index.ts`

### Phase 2: Repository 계층

- [ ] `src/repository/IUserRepository.ts`
- [ ] `src/repository/impl/UserRepository.ts`
- [ ] `src/repository/IGuildRepository.ts`
- [ ] `src/repository/impl/GuildRepository.ts`
- [ ] `src/repository/index.ts`

### Phase 3: DTO 계층

- [ ] `src/service/user/dto/UserDto.ts`
- [ ] `src/service/economy/dto/request/CoinTransferReqDto.ts`
- [ ] `src/service/economy/dto/response/CoinTransferResDto.ts`
- [ ] `src/service/economy/dto/response/UserBalanceResDto.ts`
- [ ] `src/service/leveling/dto/response/UserLevelUpResDto.ts`

### Phase 4: Service 계층

- [ ] `src/service/user/user.service.ts`
- [ ] `src/service/economy/economy.service.ts`
- [ ] `src/service/leveling/leveling.service.ts`
- [ ] `src/service/index.ts`

### Phase 5: Embed 계층

- [ ] `src/embed/balance/UserBalanceEmbed.ts`
- [ ] `src/embed/pay/CoinTransferEmbed.ts`
- [ ] `src/embed/daily/DailyRewardEmbed.ts`
- [ ] `src/embed/index.ts`

### Phase 6: Command 업데이트

- [ ] `src/command/economy/balance.ts` (Embed 사용)
- [ ] `src/command/economy/pay.ts` (Embed 사용)
- [ ] 기타 명령어

### Phase 7: 정리

- [ ] 기존 파일 제거
- [ ] `src/utils/embed.ts` 제거 (Embed 계층으로 대체)
- [ ] 문서 업데이트

---

## 계층별 책임 요약

| 계층           | 위치                 | 책임              | 비즈니스 로직 |
| -------------- | -------------------- | ----------------- | ------------- |
| **Command**    | `command/`           | Discord 인터랙션  | ❌            |
| **Embed**      | `embed/{command}/`   | Embed 생성 (View) | ❌            |
| **Service**    | `service/{domain}/`  | 비즈니스 로직     | ✅            |
| **Repository** | `repository/impl/`   | 데이터 접근       | ❌            |
| **DAO**        | `database/dao/impl/` | 단일 테이블 CRUD  | ❌            |

---

## 예상 소요 시간

| Phase    | 작업             | 예상 시간     |
| -------- | ---------------- | ------------- |
| 0        | Prisma 설정      | 1-2시간       |
| 1        | DAO 계층         | 3-4시간       |
| 2        | Repository 계층  | 2-3시간       |
| 3        | DTO 계층         | 2-3시간       |
| 4        | Service 계층     | 3-4시간       |
| 5        | Embed 계층       | 1-2시간       |
| 6        | Command 업데이트 | 1-2시간       |
| 7        | 정리 및 문서화   | 1-2시간       |
| **합계** |                  | **14-22시간** |

---

**작성일:** 2025-12-16
**버전:** 7.0 (최종 - Embed 계층 추가)

**핵심 원칙:**

- DAO는 database 폴더 내
- Service/DTO는 도메인별 관리
- Embed는 Command별 관리
- 구현체는 impl 폴더로 분리
- 모든 폴더명은 단수형
- Request, Response DTO는 절대로 재사용 불가
- Entity DTO는 필요 시 Response DTO에서만 사용
- **Embed는 Command에서만 호출 (Service 호출 금지)**
- **Embed는 생성만, 전송은 Command가 담당**
- **Command는 Class 기반으로 구현 (객체 X)**
