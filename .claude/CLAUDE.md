# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pingu Bot is a Discord entertainment bot built with Discord.js v14 and TypeScript, designed for small servers (less than 10). The bot features mini-games, virtual economy, leveling system, and fun commands.

**Core Technologies:**

- Discord.js v14
- TypeScript 5.x
- Node.js 20+
- PostgreSQL (Railway)
- Prisma ORM 5.x
- Node-cache for caching

**Development Status:** Phase 2 (Economy System) - Core infrastructure implemented with 6-layer architecture

## Development Commands

### Setup

```bash
# Install dependencies
yarn install

# Generate Prisma Client
yarn prisma:generate

# Development mode with auto-restart
yarn dev

# Build TypeScript
yarn build

# Production execution
yarn start

# Linting
yarn lint

# Testing
yarn test
```

### Database Commands

```bash
# Generate Prisma Client
yarn prisma:generate

# Run migrations
yarn prisma:migrate

# Push schema to database (development)
yarn prisma:push

# Open Prisma Studio
yarn prisma:studio
```

### Deployment

- PM2 for process management in production
- Configuration in `ecosystem.config.js`
- Hosting on Railway

## Architecture Overview

### 6-Layer Architecture

Pingu Bot follows a strict layered architecture pattern with clear separation of concerns:

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

### Project Structure

```
src/
├── index.ts                    # Entry point
├── bot.ts                      # Main Bot class (PinguBot extends Client)
├── config/                     # Configuration management
│   ├── config.ts               # Environment variables
│   └── constants.ts            # Application constants
├── commands/                   # Command handlers (Class-based)
│   ├── economy/                # Economy commands (balance, pay, daily)
│   ├── games/                  # Game commands (dice, rps, coinflip, guess)
│   ├── leveling/               # Leveling commands (level)
│   ├── fun/                    # Fun commands (penguin, 8ball, choose, roll)
│   └── utility/                # Utility commands (help, ping)
├── events/                     # Event handlers
│   ├── ready.ts                # Bot ready event
│   ├── interactionCreate.ts   # Slash command handler
│   ├── messageCreate.ts        # Message-based XP handler
│   └── guildMemberAdd.ts       # Welcome message handler
├── embed/                      # Discord Embed builders (View layer)
│   ├── balance/                # Balance display embeds
│   ├── pay/                    # Payment result embeds
│   ├── daily/                  # Daily reward embeds
│   └── level/                  # Level info embeds
├── service/                    # Business logic layer (Domain-driven)
│   ├── user/
│   │   └── dto/                # User domain DTOs
│   │       └── UserDto.ts      # Entity DTO
│   ├── economy/
│   │   ├── economy.service.ts  # Economy business logic
│   │   └── dto/
│   │       ├── request/        # Request DTOs
│   │       └── response/       # Response DTOs
│   └── leveling/
│       ├── leveling.service.ts # Leveling business logic
│       └── dto/
│           ├── request/
│           └── response/
├── repository/                 # Repository layer
│   ├── IUserRepository.ts      # User repository interface
│   ├── IGuildRepository.ts     # Guild repository interface
│   └── impl/                   # Repository implementations
│       ├── UserRepository.ts
│       └── GuildRepository.ts
├── database/                   # Database layer
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
├── utils/                      # Utility functions
│   └── logger.ts               # Winston logger
├── types/                      # TypeScript interfaces
│   ├── command.ts              # Command interface
│   └── event.ts                # Event interface
└── middleware/                 # Middleware (future)
```

### Key Architectural Patterns

#### 1. Command System (Class-based)

Commands are implemented as classes that implement the `Command` interface:

```typescript
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
    // 1. Create Request DTO
    const reqDto = new UserBalanceReqDto({ userId, username });

    // 2. Call Service
    const balanceRes = await this.economyService.getBalance(reqDto);

    // 3. Create Embed (View)
    const embed = UserBalanceEmbed.create({ ... });

    // 4. Send response
    await interaction.reply({ embeds: [embed] });
  }
}
```

**Key Rules:**

- Commands are **Class-based** (not object literals)
- Commands **only** handle Discord interactions
- Commands create **Request DTOs** before calling Services
- Commands create **Embeds** for responses (never in Service)
- Commands handle errors and send user-friendly messages

#### 2. Embed Layer (View)

Embeds handle Discord message formatting:

```typescript
export class UserBalanceEmbed {
  static create(props: {
    username: string;
    coins: number;
    level: number;
  }): EmbedBuilder {
    return new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💰 잔액 조회')
      .addFields(/* ... */);
  }
}
```

**Key Rules:**

- Embeds are **static classes** with factory methods
- Embeds **only** create Discord EmbedBuilder objects
- Embeds **never** called from Service layer (only from Commands)
- Embeds receive plain data as props (not DTOs)

#### 3. Service Layer (Business Logic)

Services contain **ALL** business logic:

```typescript
export class EconomyService {
  constructor(
    private userRepository: IUserRepository = new UserRepository()
  ) {}

  async transferCoins(
    reqDto: CoinTransferReqDto
  ): Promise<CoinTransferResDto> {
    // ✅ Business Logic: Validation
    if (amount < 10) throw new Error('최소 전송 금액은 10 PC입니다.');

    // ✅ Business Logic: Balance check
    const sender = await this.userRepository.findOrCreate(fromId, fromUsername);
    if (sender.coins < amount) throw new Error('잔액이 부족합니다.');

    // ✅ Repository call (data access only)
    const result = await this.userRepository.transferCoins(fromId, toId, amount);

    // ✅ Return Response DTO
    return new CoinTransferResDto({ ... });
  }
}
```

**Key Rules:**

- Services contain **ALL** business logic (validation, calculations, rules)
- Services **always** receive Request DTOs
- Services **always** return Response DTOs
- Services inject Repositories (dependency injection)
- Services **never** access DAOs directly

#### 4. DTO Pattern (Data Transfer Objects)

Three types of DTOs:

**Request DTO:** `{Domain}{Action}ReqDto`

```typescript
export class CoinTransferReqDto {
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly amount: number;

  constructor(props: { ... }) { /* ... */ }
}
```

**Response DTO:** `{Domain}{Action}ResDto`

```typescript
export class CoinTransferResDto {
  readonly sender: Pick<UserDto, 'userId' | 'username' | 'coins'>;
  readonly receiver: Pick<UserDto, 'userId' | 'username' | 'coins'>;
  readonly amount: number;

  constructor(props: { ... }) { /* ... */ }
}
```

**Entity DTO:** `{EntityName}Dto` (used only in Response DTOs)

```typescript
export class UserDto {
  readonly userId: string;
  readonly username: string;
  readonly coins: number;
  readonly level: number;

  constructor(props: { ... }) { /* ... */ }
}
```

**Key Rules:**

- All properties are **readonly** (immutability)
- Use TypeScript utility types (`Pick`, `Omit`, `Partial`) instead of creating new Entity DTOs
- Entity DTOs **only** used within Response DTOs
- Never reuse Request/Response DTOs across different operations

#### 5. Repository Layer (Complex Data Access)

Repositories combine multiple DAOs and handle complex queries:

```typescript
export class UserRepository implements IUserRepository {
  constructor(private userDAO: IUserDAO = new UserDAO()) {}

  async transferCoins(
    fromId: string,
    toId: string,
    amount: number
  ): Promise<{ sender: User; receiver: User }> {
    // ✅ Transaction handling
    return await prisma.$transaction(async (tx) => {
      const sender = await tx.user.update({
        /* ... */
      });
      const receiver = await tx.user.update({
        /* ... */
      });
      return { sender, receiver };
    });
  }
}
```

**Key Rules:**

- Repositories inject DAOs
- Repositories handle transactions
- Repositories provide complex data access (joins, aggregations)
- Repositories **NEVER** contain business logic
- Repository methods like `findOrCreate`, `transferCoins` are allowed (data access, not business logic)

#### 6. DAO Layer (CRUD Operations)

DAOs provide pure CRUD operations for single tables:

```typescript
export class UserDAO implements IUserDAO {
  async findById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { userId } });
  }

  async incrementCoins(userId: string, amount: number): Promise<User> {
    return await prisma.user.update({
      where: { userId },
      data: { coins: { increment: amount } },
    });
  }
}
```

**Key Rules:**

- **One DAO per table** (1:1 mapping)
- DAOs contain **only** CRUD operations
- DAOs use Prisma Client directly
- DAOs **never** call other DAOs
- DAOs **never** contain business logic

#### 7. Prisma Layer

Type-safe ORM for database access:

```typescript
// Singleton pattern
export const prisma = PrismaService.getInstance().getClient();
```

**Key Features:**

- Type-safe queries
- Auto-generated types from schema
- Transaction support
- Migration management

### Data Models (Prisma Schema)

**User Model:**

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

  gameStats  GameStat[]
  cooldowns  Cooldown[]

  @@map("users")
}
```

**Guild Model:**

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

### Key Systems

**Economy System:**

- Virtual currency: PC (Pingu Coins)
- Daily rewards with 24h cooldown (100 PC)
- Coin transfers between users (minimum 10 PC)
- Balance checking with level display
- Leaderboard by coins/level/wins

**Leveling System:**

- XP earned from messages (15-25 XP per message)
- 60-second cooldown between XP gains
- Level formula: `XP = 100 * level^1.5`
- Levelup rewards: `level × 100 PC`
- Progress visualization with progress bars

**Game System (Planned):**

- Games: dice, rock-paper-scissors, coinflip, guess number
- Betting system integrated with economy
- Game statistics tracked in database
- Win/loss records per user

**Cooldown System:**

- Per-command cooldowns defined in command metadata
- Memory-based tracking (Collection in PinguBot)
- User-friendly cooldown remaining messages

## Important Implementation Notes

### Discord.js v14 Intents

The bot requires these Gateway Intents:

- `Guilds` - Basic guild information
- `GuildMessages` - For message-based XP
- `GuildMembers` - For welcome messages
- `MessageContent` - Privileged intent for reading message content

### Environment Variables

Required in `.env`:

- `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- `DISCORD_CLIENT_ID` - Application ID
- `DATABASE_URL` - PostgreSQL connection string (Railway)
- `NODE_ENV` - development/production
- `UNSPLASH_ACCESS_KEY` - For penguin image API (optional)

### Error Handling Strategy

Multi-layer error handling:

1. **Command level** - User-friendly messages, ephemeral replies
2. **Service level** - Business logic errors (validation, insufficient balance, etc.)
3. **Repository level** - Transaction rollback on errors
4. **DAO level** - Database operation errors

### Security Considerations

- Input validation in Service layer (all user inputs)
- SQL injection prevention via Prisma (parameterized queries)
- Rate limiting via cooldown system
- Permission checks for admin commands
- Environment variables for secrets

### Logging Strategy

- Structured logging with Winston
- Log levels: ERROR, WARN, INFO, DEBUG
- Production: file-based logging with rotation
- Development: console logging
- Log context: command, user, guild, timestamp

### Architectural Rules to Follow

**When creating new features:**

1. **Never skip layers** - Always follow Command → Service → Repository → DAO flow
2. **Business logic only in Service** - Validation, calculations, rules in Service layer
3. **Always use DTOs** - All Service methods receive Request DTO, return Response DTO
4. **Embeds only in Commands** - Never create Embeds in Service/Repository/DAO
5. **One DAO per table** - Never combine tables in a single DAO
6. **Repositories can combine DAOs** - But no business logic in Repository
7. **All DTO properties readonly** - Enforce immutability
8. **Use TypeScript utility types** - Prefer `Pick`, `Omit` over new DTOs

**Example of correct flow:**

```
User clicks /balance
    ↓
BalanceCommand.execute()
    ↓ (creates UserBalanceReqDto)
EconomyService.getBalance(reqDto)
    ↓ (validation, business logic)
UserRepository.findOrCreate(userId, username)
    ↓
UserDAO.findById(userId) or UserDAO.create(...)
    ↓
Prisma Client query
    ↓
Database (PostgreSQL)
    ↓ (returns User)
Service creates UserBalanceResDto
    ↓
Command creates UserBalanceEmbed
    ↓
Discord sends embed to user
```

## Language and Localization

- Primary language: Korean (ko)
- User-facing messages in Korean
- Inline code comments in Korean
- English support planned for future
- Language configurable per guild

## Korean-Specific Notes

This codebase uses Korean for:

- User-facing bot responses
- Inline code comments
- Log messages
- Error messages

When working on this project, maintain Korean for user-facing content unless specifically asked to use English.

## Commits & PRs

### Commit Rules

- DO NOT write any credits below message body
