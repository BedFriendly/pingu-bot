# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pingu Bot is a Discord entertainment bot built with Discord.js v14 and TypeScript, designed for small servers (less than 10). The bot features mini-games, virtual economy, leveling system, and fun commands.

**Core Technologies:**

- Discord.js v14
- TypeScript 5.x
- Node.js 18+
- SQLite (initial), PostgreSQL (future migration)
- Node-cache for caching

**Development Status:** Phase 0 (Project Setup) - No source code exists yet

## Development Commands

### Setup (Not yet implemented)

```bash
# Install dependencies
yarn install

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

### Database Commands (Planned)

- Database initialization will use migration scripts in `src/database/migrations/`
- Schema defined in `src/database/schema.sql`

### Deployment (Planned)

- PM2 for process management in production
- Configuration in `ecosystem.config.js` (to be created)
- Hosting on Railway or Fly.io

## Architecture Overview

### Project Structure (Planned)

```
src/
├── index.ts              # Entry point
├── bot.ts                # Main Bot class (PinguBot extends Client)
├── config/               # Configuration management
├── commands/             # Command handlers organized by category
│   ├── games/            # Game commands (dice, rps, coinflip, guess)
│   ├── economy/          # Economy commands (daily, balance, pay, leaderboard)
│   ├── leveling/         # Leveling commands (level)
│   ├── fun/              # Fun commands (penguin, 8ball, choose, roll)
│   └── utility/          # Utility commands (help, info, ping)
├── events/               # Event handlers (ready, interactionCreate, messageCreate, guildMemberAdd)
├── database/             # Database layer
│   ├── models/           # Data models (User, Guild, GameStats)
│   └── migrations/       # Migration scripts
├── services/             # Business logic layer
│   ├── economy.service.ts
│   ├── leveling.service.ts
│   ├── game.service.ts
│   └── image.service.ts
├── utils/                # Utility functions
├── types/                # TypeScript interfaces and types
└── middleware/           # Middleware (cooldown, permissions)
```

### Key Architectural Patterns

**Command System:**

- Commands dynamically loaded from `src/commands/` subdirectories
- Each command implements the `Command` interface with `data`, `category`, `cooldown`, and `execute`
- Commands organized by category: games, economy, leveling, fun, utility
- Slash commands registered with Discord API on bot startup

**Event System:**

- Events dynamically loaded from `src/events/`
- Each event implements `BotEvent` interface with `name`, `once?`, and `execute`
- Events automatically bound to Discord.js Client

**Service Layer:**

- Business logic separated from command handlers
- Services handle: EconomyService, LevelingService, GameService, ImageService
- Services interact with database models

**Database Layer:**

- Models provide CRUD operations for: User, Guild, GameStats
- SQLite for initial development (file-based)
- Prepared statements to prevent SQL injection
- Future migration path to PostgreSQL

**Middleware:**

- Cooldown middleware prevents command spam
- Permission middleware restricts admin commands
- Cooldowns stored in memory (Collection)

### Core Classes

**PinguBot (src/bot.ts):**

```typescript
export class PinguBot extends Client {
  public commands: Collection<string, Command>;
  public cooldowns: Collection<string, Collection<string, number>>;

  // Methods: start(), loadCommands(), loadEvents()
}
```

**Command Interface (src/types/command.ts):**

```typescript
export interface Command {
  data: SlashCommandBuilder;
  category: 'games' | 'economy' | 'leveling' | 'fun' | 'utility';
  cooldown?: number;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
```

**Event Interface (src/types/event.ts):**

```typescript
export interface BotEvent {
  name: keyof ClientEvents;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}
```

### Data Models

**User Model:**

- user_id, username, coins, experience, level
- total_wins, total_games, last_daily
- Methods: findById, create, update, addCoins, addExperience

**Guild Model:**

- guild_id, guild_name, prefix, level_channel_id, welcome_channel_id, language

**GameStats Model:**

- Tracks game history: user_id, game_type, result, bet_amount, profit

### Key Systems

**Economy System:**

- Virtual currency: PC (Pingu Coins)
- Daily rewards with 24h cooldown
- Coin transfers between users (minimum 10 PC)
- Leaderboard by coins/level/wins

**Leveling System:**

- XP earned from messages (15-25 XP per message)
- 60-second cooldown between XP gains
- Level formula: `XP = 100 * level^1.5`
- Levelup rewards: level × 100 PC
- Progress visualization with progress bars

**Game System:**

- Games: dice, rock-paper-scissors, coinflip, guess number
- Betting system integrated with economy
- Game statistics tracked in database
- Win/loss records per user

**Cooldown System:**

- Per-command cooldowns defined in command metadata
- Memory-based tracking (Collection)
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
- `UNSPLASH_ACCESS_KEY` - For penguin image API (optional)
- `NODE_ENV` - development/production

### Error Handling Strategy

Three-layer error handling:

1. **Command level** - User-friendly messages, ephemeral replies
2. **Service level** - Custom error classes (TransferError, ValidationError, etc.)
3. **Database level** - DatabaseError with transaction rollback

### Security Considerations

- Input validation on all user inputs (amounts, choices)
- SQL injection prevention via prepared statements
- Rate limiting via cooldown system
- Permission checks for admin commands
- Token and API keys in environment variables

### Logging Strategy

- Structured logging with context (command, user, guild, timestamp)
- Log levels: ERROR, WARN, INFO, DEBUG
- Production: file-based logging with rotation
- Development: console logging

### Testing Approach

- Unit tests for services (Economy, Leveling, Game)
- Unit tests for utility functions
- Integration tests for commands (with mocking)
- Target: 50% code coverage minimum

## Development Phases

The project follows a phased development approach (see docs/ROADMAP.md):

**Phase 0: Project Setup** (Current Phase)

- Initialize Node.js project, TypeScript, and development tools
- Set up Discord bot in Developer Portal
- Create folder structure

**Phase 1: Core Infrastructure**

- Implement Bot class, command/event systems
- Database setup with SQLite
- First commands: /ping, /help

**Phase 2: Economy System** (MVP)

- User/Guild models
- Commands: /daily, /balance, /pay, /leaderboard
- Cooldown system

**Phase 3: Mini Games** (MVP)

- Game service and GameStats model
- Commands: /dice, /rps, /coinflip, /guess, /roll

**Phase 4: Leveling System** (MVP)

- Message-based XP system
- Levelup notifications
- Command: /level

**Phases 5-10:**

- Fun commands, server management, testing, deployment, documentation, iteration

## External APIs

**Unsplash API:**

- Used for `/penguin` command
- Fetches random penguin images
- Cached to minimize API calls
- API key required in environment

## Language and Localization

- Primary language: Korean (ko)
- Comments and user-facing messages in Korean
- English (en) support planned for future
- Language configurable per guild

## Korean-Specific Notes

This codebase uses Korean for:

- Documentation files (FEATURE_SPEC.md, ARCHITECTURE.md, ROADMAP.md)
- User-facing bot responses
- Inline code comments
- Database field values (language setting)

When working on this project, maintain Korean for user-facing content and documentation unless specifically asked to use English.
