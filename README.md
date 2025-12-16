# 🐧 Pingu Bot

소규모 서버(10명 이하)를 위한 디스코드 엔터테인먼트 봇입니다. Discord.js v14와 TypeScript로 개발되었으며, 미니게임, 가상 경제, 레벨링 시스템을 제공합니다.

> **개발 상태**: Phase 2 (Economy System) - 6-layer 아키텍처 기반 핵심 인프라 구축 완료

## ✨ 주요 기능

### 구현 완료
- **경제 시스템**: 가상 화폐(PC), 일일 보상(24시간 쿨다운), 송금 기능
- **레벨링 시스템**: 메시지 기반 XP 획득, 레벨업 보상, 진행도 시각화
- **재미 명령어**: 펭귄 이미지, Magic 8-Ball, 랜덤 선택기, 주사위
- **유틸리티**: 핑, 도움말, 잔액 조회

### 개발 예정
- **미니게임**: 주사위, 가위바위보, 동전 던지기, 숫자 맞추기 (배팅 시스템 포함)
- **서버 관리**: 환영 메시지, 설정 명령어, 리더보드

## 🏗️ 아키텍처

### 6-Layer Architecture

Pingu Bot은 명확한 관심사 분리를 위한 계층화된 아키텍처를 따릅니다.

```
Command Layer (Discord UI)
    ↓
Embed Layer (View)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Complex Data Access)
    ↓
DAO Layer (CRUD Operations)
    ↓
Prisma Layer (Type-safe ORM)
    ↓
PostgreSQL Database
```

**계층별 역할:**

- **Command Layer**: Discord 인터랙션 처리, Request DTO 생성, Embed 생성
- **Embed Layer**: Discord Embed 생성 (View 역할)
- **Service Layer**: 모든 비즈니스 로직 (검증, 계산, 규칙)
- **Repository Layer**: 복잡한 데이터 접근 (트랜잭션, 조인, 집계)
- **DAO Layer**: 순수 CRUD 작업 (테이블당 1개의 DAO)
- **Prisma Layer**: 타입 안전한 ORM

### 핵심 패턴

**1. Class-based Command System**
```typescript
export default class BalanceCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('잔액을 확인합니다');

  category = 'economy' as const;
  cooldown = 5;

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Request DTO 생성 → Service 호출 → Embed 생성 → 응답
  }
}
```

**2. DTO Pattern**
- **Request DTO**: `{Domain}{Action}ReqDto` - Service 메서드의 입력
- **Response DTO**: `{Domain}{Action}ResDto` - Service 메서드의 출력
- **Entity DTO**: `{EntityName}Dto` - Response DTO 내부에서만 사용

모든 DTO 속성은 `readonly`로 불변성을 보장합니다.

**3. Dependency Injection**
```typescript
export class EconomyService {
  constructor(
    private userRepository: IUserRepository = new UserRepository()
  ) {}
}
```

## 🛠️ 기술 스택

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x
- **Framework**: Discord.js v14
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma 5.x
- **Cache**: Node-cache
- **Logging**: Winston
- **Process Manager**: PM2

## 📦 설치 방법

### 사전 요구사항

- Node.js 20+
- Yarn 패키지 매니저
- PostgreSQL 데이터베이스 (Railway 권장)
- Discord Bot Token ([여기서 발급](https://discord.com/developers/applications))

### 설치 단계

1. 저장소 클론:

```bash
git clone https://github.com/BedFriendly/pingu-bot.git
cd pingu-bot
```

2. 의존성 설치:

```bash
yarn install
```

3. 환경 변수 파일 생성:

```bash
cp .env.example .env
```

4. `.env` 파일 설정:

```env
# Discord 설정 (필수)
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# 데이터베이스 (필수)
DATABASE_URL=postgresql://user:password@host:port/database

# 환경 설정
NODE_ENV=development

# 선택 사항
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
LOG_LEVEL=info
```

5. Prisma 클라이언트 생성 및 마이그레이션:

```bash
yarn prisma:generate
yarn prisma:migrate
```

6. 프로젝트 빌드:

```bash
yarn build
```

## 🚀 봇 실행

### 개발 모드

자동 재시작과 함께 개발 모드로 실행:

```bash
yarn dev
```

### 프로덕션 모드 (로컬)

빌드된 코드 실행:

```bash
yarn start
```

### PM2 사용 (로컬 프로덕션)

```bash
yarn pm2:start    # 봇 시작
yarn pm2:stop     # 봇 중지
yarn pm2:restart  # 봇 재시작
yarn pm2:logs     # 로그 확인
```

### Railway 배포 (권장)

Railway는 프로덕션 배포를 위한 권장 플랫폼입니다.

**빠른 시작:**

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 초기화
railway init

# 환경 변수 설정
railway variables set DISCORD_TOKEN="your_token"
railway variables set DISCORD_CLIENT_ID="your_client_id"
railway variables set DATABASE_URL="your_postgres_url"

# 배포
railway up
```

**자세한 가이드:**
- [Railway 빠른 시작 가이드](docs/QUICK_START_RAILWAY.md)
- [전체 배포 문서](docs/DEPLOYMENT.md)

## 📝 개발 명령어

### 기본 명령어
```bash
yarn install          # 의존성 설치
yarn dev              # 개발 모드 실행 (자동 재시작)
yarn build            # TypeScript 컴파일
yarn start            # 프로덕션 모드 실행
yarn lint             # ESLint 검사
yarn test             # 테스트 실행
```

### Prisma 명령어
```bash
yarn prisma:generate  # Prisma Client 생성
yarn prisma:migrate   # 마이그레이션 실행
yarn prisma:push      # 스키마를 DB에 동기화 (개발용)
yarn prisma:studio    # Prisma Studio 실행 (DB GUI)
```

### PM2 명령어
```bash
yarn pm2:start        # PM2로 봇 시작
yarn pm2:stop         # PM2 프로세스 중지
yarn pm2:restart      # PM2 프로세스 재시작
yarn pm2:logs         # PM2 로그 확인
```

## 🗂️ 프로젝트 구조

```
src/
├── index.ts                    # Entry point
├── bot.ts                      # Main Bot class (PinguBot extends Client)
├── config/                     # 환경 설정
│   ├── config.ts               # 환경 변수 관리
│   └── constants.ts            # 애플리케이션 상수
│
├── command/                    # Command Layer (Discord UI)
│   ├── economy/                # 경제 명령어 (balance, pay, daily)
│   ├── game/                   # 게임 명령어 (dice, rps, coinflip, guess)
│   ├── leveling/               # 레벨링 명령어 (level)
│   ├── fun/                    # 재미 명령어 (penguin, 8ball, choose, roll)
│   └── utility/                # 유틸리티 명령어 (help, ping)
│
├── events/                     # Event Handlers
│   ├── ready.ts                # Bot ready event
│   ├── interactionCreate.ts    # Slash command handler
│   ├── messageCreate.ts        # Message-based XP handler
│   └── guildMemberAdd.ts       # Welcome message handler
│
├── embed/                      # Embed Layer (View)
│   ├── balance/                # 잔액 표시 Embed
│   ├── pay/                    # 송금 결과 Embed
│   ├── daily/                  # 일일 보상 Embed
│   └── level/                  # 레벨 정보 Embed
│
├── service/                    # Service Layer (Business Logic)
│   ├── user/
│   │   └── dto/                # User domain DTOs
│   │       └── UserDto.ts      # Entity DTO
│   ├── economy/
│   │   ├── economy.service.ts  # 경제 비즈니스 로직
│   │   └── dto/
│   │       ├── request/        # Request DTOs
│   │       └── response/       # Response DTOs
│   └── leveling/
│       ├── leveling.service.ts # 레벨링 비즈니스 로직
│       └── dto/
│           ├── request/
│           └── response/
│
├── repository/                 # Repository Layer (Complex Data Access)
│   ├── IUserRepository.ts      # User repository interface
│   ├── IGuildRepository.ts     # Guild repository interface
│   └── impl/                   # Repository implementations
│       ├── UserRepository.ts
│       └── GuildRepository.ts
│
├── database/                   # Database Layer
│   ├── prisma.ts               # Prisma client singleton
│   ├── dao/                    # Data Access Objects
│   │   ├── IUserDAO.ts         # User DAO interface
│   │   ├── IGuildDAO.ts        # Guild DAO interface
│   │   ├── IGameStatDAO.ts     # GameStat DAO interface
│   │   └── impl/               # DAO implementations
│   │       ├── UserDAO.ts
│   │       ├── GuildDAO.ts
│   │       └── GameStatDAO.ts
│   └── migrations/             # Migration scripts
│
├── utils/                      # Utility functions
│   └── logger.ts               # Winston logger
│
├── types/                      # TypeScript interfaces
│   ├── command.ts              # Command interface
│   └── event.ts                # Event interface
│
└── middleware/                 # Middleware (future)
```

## 🔧 주요 시스템

### 경제 시스템

- **가상 화폐**: PC (Pingu Coins)
- **일일 보상**: 24시간 쿨다운, 100 PC 지급
- **송금 기능**: 사용자 간 코인 전송 (최소 10 PC)
- **잔액 조회**: 레벨 정보와 함께 표시
- **리더보드**: 코인/레벨/승률 기준 순위 (개발 예정)

### 레벨링 시스템

- **XP 획득**: 메시지당 15-25 XP (60초 쿨다운)
- **레벨 공식**: `XP = 100 × level^1.5`
- **레벨업 보상**: `level × 100 PC`
- **진행도 시각화**: 프로그레스 바로 표시

### 데이터 모델

**User Model:**
```prisma
model User {
  userId      String    @id
  username    String
  coins       Int       @default(0)
  experience  Int       @default(0)
  level       Int       @default(1)
  totalWins   Int       @default(0)
  totalGames  Int       @default(0)
  lastDaily   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Guild Model:**
```prisma
model Guild {
  guildId           String   @id
  guildName         String
  prefix            String   @default("!")
  levelChannelId    String?
  welcomeChannelId  String?
  language          String   @default("ko")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## ⚙️ 환경 설정

### 필수 환경 변수

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `DISCORD_TOKEN` | Discord 봇 토큰 | 필수 |
| `DISCORD_CLIENT_ID` | Discord 애플리케이션 ID | 필수 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | 필수 |
| `NODE_ENV` | 실행 환경 (development/production) | 필수 |

### 선택 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `UNSPLASH_ACCESS_KEY` | Unsplash API 키 (펭귄 이미지) | - |
| `LOG_LEVEL` | 로그 레벨 (error/warn/info/debug) | info |

### Discord.js v14 Intents

봇은 다음 Gateway Intents가 필요합니다:

- `Guilds` - 기본 길드 정보
- `GuildMessages` - 메시지 기반 XP 획득
- `GuildMembers` - 환영 메시지
- `MessageContent` - 메시지 내용 읽기 (Privileged Intent)

### PM2 설정

`ecosystem.config.js` 파일에서 PM2 설정을 확인할 수 있습니다.

## 📖 문서

### 기획 및 설계

- [CLAUDE.md](/.claude/CLAUDE.md) - Claude Code를 위한 프로젝트 가이드
- [기능 명세서](docs/FEATURE_SPEC.md) - 전체 기능 명세
- [아키텍처 설계](docs/ARCHITECTURE.md) - 시스템 아키텍처
- [개발 로드맵](docs/ROADMAP.md) - 개발 단계별 계획

### 배포 및 운영

- [Railway 빠른 시작](docs/QUICK_START_RAILWAY.md) - 5분 안에 배포하기
- [Railway 배포 가이드](docs/DEPLOYMENT.md) - 전체 배포 프로세스
- [백업 스크립트](scripts/railway-backup.sh) - 데이터베이스 백업

## 🏛️ 아키텍처 원칙

### 계층 간 데이터 흐름

```
사용자가 /balance 클릭
    ↓
BalanceCommand.execute()
    ↓ (UserBalanceReqDto 생성)
EconomyService.getBalance(reqDto)
    ↓ (검증, 비즈니스 로직)
UserRepository.findOrCreate(userId, username)
    ↓
UserDAO.findById(userId) or UserDAO.create(...)
    ↓
Prisma Client query
    ↓
PostgreSQL Database
    ↓ (User 반환)
Service가 UserBalanceResDto 생성
    ↓
Command가 UserBalanceEmbed 생성
    ↓
Discord가 Embed를 사용자에게 전송
```

### 핵심 규칙

1. **계층을 건너뛰지 않기** - 항상 Command → Service → Repository → DAO 흐름을 따름
2. **비즈니스 로직은 Service에만** - 검증, 계산, 규칙은 Service 계층에서만
3. **항상 DTO 사용** - 모든 Service 메서드는 Request DTO를 받고 Response DTO를 반환
4. **Embed는 Command에서만** - Service/Repository/DAO에서 Embed를 생성하지 않음
5. **테이블당 1개의 DAO** - DAO는 단일 테이블에 대한 CRUD만 처리
6. **Repository는 DAO를 조합** - 복잡한 쿼리와 트랜잭션은 Repository에서
7. **모든 DTO 속성은 readonly** - 불변성 강제
8. **TypeScript 유틸리티 타입 활용** - 새 DTO 생성 대신 `Pick`, `Omit` 사용

## 🔒 보안 및 에러 처리

### 보안 고려사항

- Service 계층에서 모든 사용자 입력 검증
- Prisma의 파라미터화된 쿼리로 SQL 인젝션 방지
- 쿨다운 시스템을 통한 Rate Limiting
- 관리자 명령어에 대한 권한 확인
- 환경 변수를 통한 민감 정보 관리

### 에러 처리 전략

1. **Command 계층** - 사용자 친화적 메시지, ephemeral 응답
2. **Service 계층** - 비즈니스 로직 에러 (검증, 잔액 부족 등)
3. **Repository 계층** - 트랜잭션 실패 시 롤백
4. **DAO 계층** - 데이터베이스 작업 에러

### 로깅 전략

- Winston을 사용한 구조화된 로깅
- 로그 레벨: ERROR, WARN, INFO, DEBUG
- 프로덕션: 파일 기반 로깅 (로테이션)
- 개발: 콘솔 로깅
- 로그 컨텍스트: command, user, guild, timestamp

## 🤝 기여하기

이 프로젝트는 학습 목적의 프로젝트입니다. 기여, 이슈, 기능 제안을 환영합니다!

### 개발 시 주의사항

- CLAUDE.md의 아키텍처 원칙을 따라주세요
- 모든 비즈니스 로직은 Service 계층에 작성해주세요
- DTO 패턴을 사용하고 속성은 readonly로 선언해주세요
- 커밋 메시지는 한국어로 작성해주세요
- 사용자 대면 메시지는 한국어로 작성해주세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👨‍💻 개발자

**slo0ey**

- GitHub: [@BedFriendly](https://github.com/BedFriendly)
- Email: rurchi1206@gmail.com

---

Made with love and penguins by the Pingu Bot team
