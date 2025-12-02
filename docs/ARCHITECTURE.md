# Pingu Bot - 아키텍처 설계

## 기술 스택

### Core

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Bot Framework**: Discord.js v14
- **Package Manager**: npm

### Database

- **Primary**: SQLite (초기 단계)
  - 이유: 설정 간단, 파일 기반, 소규모 적합
  - 추후 PostgreSQL로 마이그레이션 가능
- **Caching** (Optional): Node-cache
  - 메모리 기반 캐싱으로 시작
  - 필요시 Redis로 전환

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
│   ├── index.ts                 # 진입점
│   ├── bot.ts                   # Bot 클래스
│   ├── config/
│   │   ├── config.ts            # 설정 관리
│   │   └── constants.ts         # 상수 정의
│   ├── commands/
│   │   ├── index.ts             # 명령어 로더
│   │   ├── games/               # 게임 명령어
│   │   │   ├── dice.ts
│   │   │   ├── rps.ts
│   │   │   ├── coinflip.ts
│   │   │   └── guess.ts
│   │   ├── economy/             # 경제 명령어
│   │   │   ├── daily.ts
│   │   │   ├── balance.ts
│   │   │   ├── pay.ts
│   │   │   └── leaderboard.ts
│   │   ├── leveling/            # 레벨링 명령어
│   │   │   └── level.ts
│   │   ├── fun/                 # 재미 명령어
│   │   │   ├── penguin.ts
│   │   │   ├── 8ball.ts
│   │   │   ├── choose.ts
│   │   │   └── roll.ts
│   │   └── utility/             # 유틸리티 명령어
│   │       ├── help.ts
│   │       ├── info.ts
│   │       └── ping.ts
│   ├── events/
│   │   ├── index.ts             # 이벤트 로더
│   │   ├── ready.ts             # 봇 준비 완료
│   │   ├── interactionCreate.ts # 인터랙션 핸들러
│   │   ├── messageCreate.ts     # 메시지 (XP 획득)
│   │   └── guildMemberAdd.ts    # 멤버 입장 (환영)
│   ├── database/
│   │   ├── index.ts             # DB 연결
│   │   ├── schema.sql           # 스키마 정의
│   │   ├── models/              # 데이터 모델
│   │   │   ├── User.ts
│   │   │   ├── Guild.ts
│   │   │   └── GameStats.ts
│   │   └── migrations/          # 마이그레이션 파일
│   │       └── 001_initial.sql
│   ├── services/
│   │   ├── economy.service.ts   # 경제 로직
│   │   ├── leveling.service.ts  # 레벨링 로직
│   │   ├── game.service.ts      # 게임 로직
│   │   └── image.service.ts     # 외부 API 호출
│   ├── utils/
│   │   ├── logger.ts            # 로깅 유틸리티
│   │   ├── embed.ts             # Embed 생성 헬퍼
│   │   ├── cooldown.ts          # 쿨다운 관리
│   │   ├── validator.ts         # 입력 검증
│   │   └── formatter.ts         # 데이터 포맷팅
│   ├── types/
│   │   ├── command.ts           # Command 인터페이스
│   │   ├── event.ts             # Event 인터페이스
│   │   └── database.ts          # DB 타입 정의
│   └── middleware/
│       ├── cooldown.ts          # 쿨다운 미들웨어
│       └── permission.ts        # 권한 체크
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   └── integration/
│       └── commands/
├── docs/
│   ├── FEATURE_SPEC.md
│   ├── ARCHITECTURE.md
│   └── API.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                     Discord API                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Bot Instance                           │
│  (Discord.js Client + Event System)                      │
└────────┬───────────────────────────────────┬────────────┘
         │                                   │
         ▼                                   ▼
┌──────────────────┐              ┌──────────────────────┐
│  Event Handlers  │              │  Command Handlers    │
│  - ready         │              │  - Slash Commands    │
│  - message       │              │  - Context Menus     │
│  - interaction   │              │  - Autocomplete      │
└────────┬─────────┘              └──────────┬───────────┘
         │                                   │
         └───────────┬───────────────────────┘
                     ▼
         ┌───────────────────────┐
         │   Service Layer       │
         │  - Economy Service    │
         │  - Leveling Service   │
         │  - Game Service       │
         │  - Image Service      │
         └──────────┬────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│  Database       │   │  External APIs   │
│  - Users        │   │  - Unsplash      │
│  - Guilds       │   │  - (others)      │
│  - GameStats    │   │                  │
└─────────────────┘   └──────────────────┘
```

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
  category: 'games' | 'economy' | 'leveling' | 'fun' | 'utility';
  cooldown?: number; // 초 단위
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
```

### 3. Event 구조 (src/types/event.ts)

```typescript
import { ClientEvents } from 'discord.js';

export interface BotEvent {
  name: keyof ClientEvents;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}
```

### 4. Database 모델 (src/database/models/User.ts)

```typescript
export interface User {
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
}

export class UserModel {
  static async findById(userId: string): Promise<User | null> {
    /* ... */
  }
  static async create(userId: string, username: string): Promise<User> {
    /* ... */
  }
  static async update(userId: string, data: Partial<User>): Promise<void> {
    /* ... */
  }
  static async addCoins(userId: string, amount: number): Promise<void> {
    /* ... */
  }
  static async addExperience(userId: string, xp: number): Promise<boolean> {
    /* ... */
  }
}
```

### 5. Economy Service (src/services/economy.service.ts)

```typescript
export class EconomyService {
  static async getBalance(userId: string): Promise<number> {
    /* ... */
  }

  static async transferCoins(
    fromId: string,
    toId: string,
    amount: number
  ): Promise<boolean> {
    /* ... */
  }

  static async claimDaily(userId: string): Promise<{
    success: boolean;
    amount?: number;
    cooldown?: number;
  }> {
    /* ... */
  }

  static async getLeaderboard(
    type: 'coins' | 'level' | 'wins',
    limit: number = 10
  ): Promise<User[]> {
    /* ... */
  }
}
```

### 6. Leveling Service (src/services/leveling.service.ts)

```typescript
export class LevelingService {
  static readonly XP_PER_MESSAGE = 15;
  static readonly XP_RANGE = 10; // 15-25 XP
  static readonly MESSAGE_COOLDOWN = 60; // 60초

  static calculateXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  static async addExperience(
    userId: string,
    guildId: string
  ): Promise<{ leveledUp: boolean; newLevel?: number }> {
    /* ... */
  }

  static async getLevelInfo(userId: string): Promise<{
    level: number;
    currentXp: number;
    requiredXp: number;
    percentage: number;
  }> {
    /* ... */
  }
}
```

## 데이터베이스 스키마

### Users 테이블

```sql
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  coins INTEGER DEFAULT 0,
  experience INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_wins INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  last_daily DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_coins ON users(coins DESC);
CREATE INDEX idx_users_level ON users(level DESC, experience DESC);
```

### Guilds 테이블

```sql
CREATE TABLE guilds (
  guild_id TEXT PRIMARY KEY,
  guild_name TEXT NOT NULL,
  prefix TEXT DEFAULT '/',
  level_channel_id TEXT,
  welcome_channel_id TEXT,
  language TEXT DEFAULT 'ko',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### GameStats 테이블

```sql
CREATE TABLE game_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL, -- 'rps', 'coinflip', 'guess', 'dice'
  result TEXT NOT NULL, -- 'win', 'loss', 'draw'
  bet_amount INTEGER DEFAULT 0,
  profit INTEGER DEFAULT 0,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_game_stats_user ON game_stats(user_id);
CREATE INDEX idx_game_stats_game ON game_stats(game_type);
```

### Cooldowns 테이블 (optional)

```sql
CREATE TABLE cooldowns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  command_name TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  UNIQUE(user_id, command_name)
);

CREATE INDEX idx_cooldowns_expires ON cooldowns(expires_at);
```

## 이벤트 흐름

### Slash Command 실행 흐름

```
1. User → Discord → Bot: /command 실행
2. Bot: interactionCreate 이벤트 발생
3. Event Handler: 명령어 검색
4. Middleware: 쿨다운 체크
5. Command Handler: execute() 실행
6. Service Layer: 비즈니스 로직 처리
7. Database: 데이터 저장/조회
8. Response: Interaction Reply
```

### 메시지 XP 획득 흐름

```
1. User: 메시지 전송
2. Bot: messageCreate 이벤트
3. Cooldown Check: 60초 이내인가?
4. LevelingService: XP 추가
5. Level Check: 레벨업 했는가?
6. If Yes: 알림 전송 + 코인 보상
7. Database: 업데이트
```

## 에러 핸들링 전략

### 1. 계층별 에러 처리

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
  static async transferCoins(from: string, to: string, amount: number) {
    try {
      // 트랜잭션 로직
    } catch (error) {
      logger.error('Transfer failed', { from, to, amount, error });
      throw new TransferError('코인 전송에 실패했습니다.');
    }
  }
}

// Database Level
class Database {
  async query(sql: string, params: any[]) {
    try {
      return await this.db.run(sql, params);
    } catch (error) {
      logger.error('Database query failed', { sql, error });
      throw new DatabaseError('데이터베이스 오류가 발생했습니다.');
    }
  }
}
```

### 2. Custom Error Classes

```typescript
export class BotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BotError';
  }
}

export class DatabaseError extends BotError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends BotError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
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
- SQLite 파일 데이터베이스

### Production

- PM2로 프로세스 관리
- 자동 재시작 설정
- Railway 또는 Fly.io 배포
- 환경 변수로 설정 관리

### CI/CD (미래)

- GitHub Actions
- 자동 테스트 실행
- Lint 검사
- 자동 배포

## 보안 고려사항

1. **환경 변수**: 토큰 및 API 키 관리
2. **입력 검증**: 모든 사용자 입력 검증
3. **Rate Limiting**: 명령어 쿨다운
4. **SQL Injection 방지**: Prepared statements 사용
5. **권한 체크**: 관리자 전용 명령어 보호

## 확장성 고려사항

### 현재 (v1.0)

- 단일 인스턴스
- SQLite
- 메모리 캐싱

### 미래 (v2.0+)

- PostgreSQL 마이그레이션
- Redis 캐싱
- 수평 확장 가능한 구조
- Sharding (필요시)

## 성능 최적화

1. **데이터베이스 인덱스**: 자주 조회되는 컬럼
2. **쿨다운 캐싱**: 메모리에서 쿨다운 관리
3. **Lazy Loading**: 필요할 때만 데이터 로드
4. **Connection Pooling**: DB 연결 재사용
5. **이미지 캐싱**: 외부 API 호출 최소화
