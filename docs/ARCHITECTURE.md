# Pingu Bot - 아키텍처 설계

## 기술 스택

### Core

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x
- **Bot Framework**: Discord.js v14
- **Package Manager**: yarn

### Database

- **Primary**: PostgreSQL (Railway)
  - Type-safe ORM: Prisma 5.x
  - Migration 관리
  - Connection pooling
- **Caching**: Node-cache
  - 메모리 기반 캐싱
  - 쿨다운 관리
  - 필요시 Redis로 전환 가능

### Development Tools

- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest
- **Build**: tsc (TypeScript Compiler)
- **Process Manager**: PM2 (프로덕션)

### External APIs

- **Image API**: Unsplash API (펭귄 이미지)
- **Monitoring** (Optional): Better Stack, Sentry

## 프로젝트 구조

```
pingu-bot/
├── src/
│   ├── index.ts                    # 진입점
│   ├── bot.ts                      # Bot 클래스 (PinguBot extends Client)
│   ├── config/
│   │   ├── config.ts               # 설정 관리
│   │   └── constants.ts            # 상수 정의
│   │
│   ├── command/                    # Command 계층 (Class 기반)
│   │   ├── economy/                # 경제 명령어
│   │   │   ├── balance.ts
│   │   │   ├── pay.ts
│   │   │   ├── daily.ts
│   │   │   └── leaderboard.ts
│   │   ├── game/                   # 게임 명령어
│   │   │   ├── dice.ts
│   │   │   ├── rps.ts
│   │   │   ├── coinflip.ts
│   │   │   └── guess.ts
│   │   ├── leveling/               # 레벨링 명령어
│   │   │   └── level.ts
│   │   ├── fun/                    # 재미 명령어
│   │   │   ├── penguin.ts
│   │   │   ├── 8ball.ts
│   │   │   ├── choose.ts
│   │   │   └── roll.ts
│   │   └── utility/                # 유틸리티 명령어
│   │       ├── help.ts
│   │       ├── info.ts
│   │       └── ping.ts
│   │
│   ├── embed/                      # Embed 계층 (Command별)
│   │   ├── balance/                # balance 명령어용 Embed
│   │   │   └── UserBalanceEmbed.ts
│   │   ├── pay/                    # pay 명령어용 Embed
│   │   │   └── CoinTransferEmbed.ts
│   │   ├── daily/                  # daily 명령어용 Embed
│   │   │   └── DailyRewardEmbed.ts
│   │   ├── level/                  # level 명령어용 Embed
│   │   │   └── UserLevelEmbed.ts
│   │   └── index.ts
│   │
│   ├── service/                    # Service 계층 (도메인별)
│   │   ├── user/                   # User 도메인
│   │   │   ├── user.service.ts     # User Service
│   │   │   └── dto/                # User DTO
│   │   │       ├── UserDto.ts      # Entity DTO
│   │   │       ├── request/        # Request DTOs
│   │   │       └── response/       # Response DTOs
│   │   │
│   │   ├── economy/                # Economy 도메인
│   │   │   ├── economy.service.ts  # Economy Service
│   │   │   └── dto/
│   │   │       ├── request/
│   │   │       │   ├── CoinTransferReqDto.ts
│   │   │       │   └── DailyRewardReqDto.ts
│   │   │       └── response/
│   │   │           ├── CoinTransferResDto.ts
│   │   │           ├── UserBalanceResDto.ts
│   │   │           ├── DailyRewardResDto.ts
│   │   │           └── UserLeaderboardResDto.ts
│   │   │
│   │   ├── leveling/               # Leveling 도메인
│   │   │   ├── leveling.service.ts # Leveling Service
│   │   │   └── dto/
│   │   │       └── response/
│   │   │           ├── UserLevelUpResDto.ts
│   │   │           └── UserLevelInfoResDto.ts
│   │   └── index.ts
│   │
│   ├── repository/                 # Repository 계층
│   │   ├── IUserRepository.ts      # Repository 인터페이스
│   │   ├── IGuildRepository.ts
│   │   ├── impl/                   # Repository 구현체
│   │   │   ├── UserRepository.ts
│   │   │   └── GuildRepository.ts
│   │   └── index.ts
│   │
│   ├── database/                   # 데이터베이스 계층
│   │   ├── prisma.ts               # Prisma Client 싱글톤
│   │   ├── dao/                    # DAO 계층
│   │   │   ├── IUserDAO.ts         # DAO 인터페이스
│   │   │   ├── IGuildDAO.ts
│   │   │   ├── IGameStatDAO.ts
│   │   │   ├── impl/               # DAO 구현체
│   │   │   │   ├── UserDAO.ts
│   │   │   │   ├── GuildDAO.ts
│   │   │   │   └── GameStatDAO.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── index.ts                # 이벤트 로더
│   │   ├── ready.ts                # 봇 준비 완료
│   │   ├── interactionCreate.ts    # 인터랙션 핸들러
│   │   ├── messageCreate.ts        # 메시지 (XP 획득)
│   │   └── guildMemberAdd.ts       # 멤버 입장 (환영)
│   │
│   ├── utils/
│   │   ├── logger.ts               # 로깅 유틸리티
│   │   ├── cooldown.ts             # 쿨다운 관리
│   │   ├── validator.ts            # 입력 검증
│   │   └── formatter.ts            # 데이터 포맷팅
│   │
│   ├── types/
│   │   ├── command.ts              # Command 인터페이스
│   │   └── event.ts                # Event 인터페이스
│   │
│   └── middleware/
│       ├── cooldown.ts             # 쿨다운 미들웨어
│       └── permission.ts           # 권한 체크
│
├── prisma/
│   ├── schema.prisma               # Prisma 스키마
│   └── migrations/                 # 마이그레이션 파일
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   └── integration/
│       └── commands/
│
├── docs/
│   ├── FEATURE_SPEC.md
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

## 6계층 아키텍처

Pingu Bot은 **Prisma + DTO + DAO + Repository + Service + Embed** 6계층 아키텍처를 따릅니다.

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                     Discord API                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                Command Layer (Discord UI)                │
│  - Class-based commands                                  │
│  - Request DTO 생성                                      │
│  - Embed 호출 및 응답 전송                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Embed Layer (View)                      │
│  - EmbedBuilder 생성                                     │
│  - 명령어별 Embed 관리                                   │
└─────────────────────────────────────────────────────────┘
                     ↑
                     │ (Command만 호출)
                     │
┌────────────────────┴────────────────────────────────────┐
│              Service Layer (Business Logic)              │
│  - 모든 비즈니스 로직                                    │
│  - Request DTO 수신                                      │
│  - Response DTO 반환                                     │
│  - Repository 호출                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Repository Layer (Complex Data Access)          │
│  - 여러 DAO 조합                                         │
│  - 트랜잭션 처리                                         │
│  - 복잡한 쿼리                                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DAO Layer (CRUD Operations)                 │
│  - 1 테이블 = 1 DAO                                     │
│  - 순수 CRUD                                             │
│  - Prisma Client 사용                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Prisma Layer (Type-safe ORM)                │
│  - Type-safe queries                                     │
│  - Auto-generated types                                  │
│  - Migration management                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL Database                       │
└─────────────────────────────────────────────────────────┘
```

### 계층별 책임

| 계층           | 위치                  | 책임                          | 비즈니스 로직 |
| -------------- | --------------------- | ----------------------------- | ------------- |
| **Command**    | `command/`            | Discord 인터랙션 처리         | ❌            |
| **Embed**      | `embed/{command}/`    | Embed 생성 (View)             | ❌            |
| **Service**    | `service/{domain}/`   | 비즈니스 로직                 | ✅            |
| **Repository** | `repository/impl/`    | 복잡한 데이터 접근            | ❌            |
| **DAO**        | `database/dao/impl/`  | 단일 테이블 CRUD              | ❌            |
| **Prisma**     | `database/prisma.ts`  | Type-safe ORM                 | ❌            |

## 핵심 모듈 설계

### 1. Bot 클래스 (src/bot.ts)

```typescript
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { Command } from './types/command';
import { BotEvent } from './types/event';

export class PinguBot extends Client {
  public commands: Collection<string, Command>;
  public cooldowns: Collection<string, Collection<string, number>>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  public async start(): Promise<void> {
    await this.loadCommands();
    await this.loadEvents();
    await this.login(process.env.DISCORD_TOKEN);
  }

  private async loadCommands(): Promise<void> {
    /* ... */
  }
  private async loadEvents(): Promise<void> {
    /* ... */
  }
}
```

### 2. Command 구조 (src/types/command.ts)

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  category: 'game' | 'economy' | 'leveling' | 'fun' | 'utility';
  cooldown?: number; // 초 단위
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
```

### 3. Command 구현 예시 (Class 기반)

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { EconomyService } from '../../service/economy/economy.service';
import { UserBalanceEmbed } from '../../embed/balance/UserBalanceEmbed';

export default class BalanceCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('잔액을 확인합니다');

  category = 'economy' as const;
  cooldown = 5;

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

### 4. Embed 구조

```typescript
import { EmbedBuilder } from 'discord.js';

export class UserBalanceEmbed {
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

### 5. Service 구조

```typescript
import { IUserRepository } from '../../repository/IUserRepository';
import { UserRepository } from '../../repository/impl/UserRepository';
import { CoinTransferReqDto } from './dto/request/CoinTransferReqDto';
import { CoinTransferResDto } from './dto/response/CoinTransferResDto';

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

### 6. Repository 구조

```typescript
import { IUserRepository } from '../IUserRepository';
import { IUserDAO } from '../../database/dao/IUserDAO';
import { UserDAO } from '../../database/dao/impl/UserDAO';
import { User } from '@prisma/client';
import { prisma } from '../../database/prisma';

export class UserRepository implements IUserRepository {
  constructor(private userDAO: IUserDAO = new UserDAO()) {}

  async findById(userId: string): Promise<User | null> {
    return this.userDAO.findById(userId);
  }

  async transferCoins(
    fromId: string,
    toId: string,
    amount: number
  ): Promise<{ sender: User; receiver: User }> {
    return await prisma.$transaction(async (tx) => {
      const sender = await tx.user.update({
        where: { user_id: fromId },
        data: { coins: { decrement: amount } },
      });
      const receiver = await tx.user.update({
        where: { user_id: toId },
        data: { coins: { increment: amount } },
      });
      return { sender, receiver };
    });
  }
}
```

### 7. DAO 구조

```typescript
import { IUserDAO } from '../IUserDAO';
import { User, Prisma } from '@prisma/client';
import { prisma } from '../../prisma';

export class UserDAO implements IUserDAO {
  async findById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { user_id: userId } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({ data });
  }

  async update(userId: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await prisma.user.update({
      where: { user_id: userId },
      data,
    });
  }

  async incrementCoins(userId: string, amount: number): Promise<User> {
    return await prisma.user.update({
      where: { user_id: userId },
      data: { coins: { increment: amount } },
    });
  }
}
```

### 8. DTO 구조

#### Entity DTO

```typescript
import { User } from '@prisma/client';

export class UserDto {
  readonly user_id: string;
  readonly username: string;
  readonly coins: number;
  readonly experience: number;
  readonly level: number;

  constructor(data: {
    user_id: string;
    username: string;
    coins: number;
    experience: number;
    level: number;
  }) {
    this.user_id = data.user_id;
    this.username = data.username;
    this.coins = data.coins;
    this.experience = data.experience;
    this.level = data.level;
  }

  static fromEntity(user: User): UserDto {
    return new UserDto(user);
  }
}
```

#### Request DTO

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

#### Response DTO

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

## 데이터베이스 스키마 (Prisma)

### User Model

```prisma
model User {
  userId     String    @id @map("user_id")
  username   String
  coins      Int       @default(0)
  experience Int       @default(0)
  level      Int       @default(1)
  totalWins  Int       @default(0) @map("total_wins")
  totalGames Int       @default(0) @map("total_games")
  lastDaily  DateTime? @map("last_daily")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  gameStats GameStat[]
  cooldowns Cooldown[]

  @@index([coins(sort: Desc)])
  @@index([level(sort: Desc), experience(sort: Desc)])
  @@map("users")
}
```

### Guild Model

```prisma
model Guild {
  guildId          String   @id @map("guild_id")
  guildName        String   @map("guild_name")
  prefix           String   @default("!")
  levelChannelId   String?  @map("level_channel_id")
  welcomeChannelId String?  @map("welcome_channel_id")
  language         String   @default("ko")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@map("guilds")
}
```

### GameStat Model

```prisma
model GameStat {
  id        Int      @id @default(autoincrement())
  userId    String   @map("user_id")
  gameType  String   @map("game_type") // 'rps', 'coinflip', 'guess', 'dice'
  result    String // 'win', 'loss', 'draw'
  betAmount Int      @default(0) @map("bet_amount")
  profit    Int      @default(0)
  playedAt  DateTime @default(now()) @map("played_at")

  user User @relation(fields: [userId], references: [userId])

  @@index([userId])
  @@index([gameType])
  @@map("game_stats")
}
```

## 이벤트 흐름

### Slash Command 실행 흐름

```
1. User → Discord → Bot: /command 실행
2. Bot: interactionCreate 이벤트 발생
3. Event Handler: 명령어 검색
4. Middleware: 쿨다운 체크
5. Command: execute() 실행
6. Command: Request DTO 생성
7. Service: 비즈니스 로직 처리
8. Repository: 데이터 접근
9. DAO: CRUD 실행
10. Prisma: Database 쿼리
11. Service: Response DTO 반환
12. Command: Embed 생성
13. Command: Interaction Reply
```

### 메시지 XP 획득 흐름

```
1. User: 메시지 전송
2. Bot: messageCreate 이벤트
3. Cooldown Check: 60초 이내인가?
4. LevelingService: XP 추가
5. Level Check: 레벨업 했는가?
6. If Yes: 알림 전송 + 코인 보상
7. Repository: 데이터 업데이트
8. DAO: Database 업데이트
```

## 에러 핸들링 전략

### 계층별 에러 처리

```typescript
// Command Level
try {
  await command.execute(interaction);
} catch (error) {
  logger.error(`Command ${command.data.name} failed`, error);
  await interaction.reply({
    content: '명령어 실행 중 오류가 발생했습니다.',
    ephemeral: true,
  });
}

// Service Level
class EconomyService {
  async transferCoins(reqDto: CoinTransferReqDto) {
    if (reqDto.amount < 10) {
      throw new Error('최소 전송 금액은 10 PC입니다.');
    }
    // ...
  }
}

// Repository Level
class UserRepository {
  async transferCoins(fromId: string, toId: string, amount: number) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 트랜잭션 로직
      });
    } catch (error) {
      logger.error('Transfer transaction failed', { fromId, toId, amount, error });
      throw error;
    }
  }
}

// DAO Level
class UserDAO {
  async findById(userId: string) {
    try {
      return await prisma.user.findUnique({ where: { user_id: userId } });
    } catch (error) {
      logger.error('DAO findById failed', { userId, error });
      throw error;
    }
  }
}
```

## 로깅 전략

### Log Levels

- **ERROR**: 즉각 대응 필요한 오류
- **WARN**: 주의가 필요한 상황
- **INFO**: 중요 이벤트 (봇 시작, 명령어 등록 등)
- **DEBUG**: 개발 디버깅 정보

### 구조화된 로깅

```typescript
logger.info('Command executed', {
  command: 'daily',
  user: interaction.user.tag,
  guild: interaction.guild?.name,
  success: true,
});
```

## 배포 전략

### Development

- 로컬 환경에서 nodemon으로 자동 재시작
- PostgreSQL (Railway)
- 환경 변수로 설정 관리

### Production

- PM2로 프로세스 관리
- 자동 재시작 설정
- Railway 배포
- 환경 변수로 설정 관리
- 로그 파일 rotation

### CI/CD (계획)

- GitHub Actions
- 자동 테스트 실행
- Lint 검사
- 자동 배포

## 보안 고려사항

1. **환경 변수**: 토큰 및 API 키 관리
2. **입력 검증**: 모든 사용자 입력 검증 (Service 계층)
3. **Rate Limiting**: 명령어 쿨다운
4. **SQL Injection 방지**: Prisma의 parameterized queries 사용
5. **권한 체크**: 관리자 전용 명령어 보호

## 확장성 고려사항

### 현재 (v1.0)

- 단일 인스턴스
- PostgreSQL (Railway)
- 메모리 캐싱 (Node-cache)
- Prisma ORM

### 미래 (v2.0+)

- Redis 캐싱
- 수평 확장 가능한 구조
- Sharding (필요시)
- 마이크로서비스 아키텍처 (필요시)

## 성능 최적화

1. **데이터베이스 인덱스**: 자주 조회되는 컬럼 (Prisma schema에 정의)
2. **쿨다운 캐싱**: 메모리에서 쿨다운 관리
3. **Lazy Loading**: 필요할 때만 데이터 로드
4. **Connection Pooling**: Prisma의 connection pooling 활용
5. **이미지 캐싱**: 외부 API 호출 최소화

## 아키텍처 설계 원칙

### 계층별 규칙

1. **Command → Embed → Service → Repository → DAO → Prisma** 흐름 준수
2. **비즈니스 로직은 Service에만** 존재
3. **모든 Service 메서드는 DTO 사용** (Request DTO 입력, Response DTO 출력)
4. **Embed는 Command에서만 호출** (Service/Repository/DAO에서 호출 금지)
5. **1 테이블 = 1 DAO** (DAO는 절대 다른 DAO 호출 금지)
6. **Repository는 여러 DAO 조합 가능** (하지만 비즈니스 로직은 없음)
7. **모든 DTO 속성은 readonly** (불변성 보장)
8. **TypeScript utility types 활용** (`Pick`, `Omit`, `Partial`)

### DTO 네이밍 규칙

- **Entity DTO**: `{EntityName}Dto` (예: `UserDto`)
- **Request DTO**: `{Domain}{Action}ReqDto` (예: `CoinTransferReqDto`)
- **Response DTO**: `{Domain}{Action}ResDto` (예: `CoinTransferResDto`)

### Embed 네이밍 규칙

- **패턴**: `{Data}{Action}Embed` (Upper Camel Case)
- **예시**: `UserBalanceEmbed`, `CoinTransferEmbed`, `DailyRewardEmbed`
