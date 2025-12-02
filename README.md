# 🐧 Pingu Bot

A feature-rich Discord entertainment bot for small servers, built with Discord.js v14 and TypeScript.

## 📋 Features (Planned)

- **Economy System**: Virtual currency with daily rewards, coin transfers, and leaderboards
- **Mini Games**: Dice, Rock-Paper-Scissors, Coin Flip, and Number Guessing
- **Leveling System**: Message-based XP and level progression
- **Fun Commands**: Penguin images, Magic 8-Ball, and random choice picker
- **Server Management**: Configurable settings, welcome messages, and more

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: Discord.js v14
- **Database**: SQLite (better-sqlite3)
- **Process Manager**: PM2

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- Yarn package manager
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))

### Steps

1. Clone the repository:
```bash
git clone https://github.com/BedFriendly/pingu-bot.git
cd pingu-bot
```

2. Install dependencies:
```bash
yarn install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
UNSPLASH_ACCESS_KEY=your_unsplash_key_here (optional)
NODE_ENV=development
```

5. Build the project:
```bash
yarn build
```

## 🚀 Running the Bot

### Development Mode
```bash
yarn dev
```

### Production Mode
```bash
yarn start
```

### Using PM2 (Production)
```bash
yarn pm2:start    # Start the bot
yarn pm2:stop     # Stop the bot
yarn pm2:restart  # Restart the bot
yarn pm2:logs     # View logs
```

## 📝 Available Scripts

- `yarn dev` - Run in development mode with hot reload
- `yarn build` - Compile TypeScript to JavaScript
- `yarn start` - Run compiled production code
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier
- `yarn pm2:start` - Start with PM2
- `yarn pm2:stop` - Stop PM2 process
- `yarn pm2:restart` - Restart PM2 process
- `yarn pm2:logs` - View PM2 logs

## 🗂️ Project Structure

```
pingu-bot/
├── src/
│   ├── commands/          # Command handlers
│   │   ├── games/        # Game commands
│   │   ├── economy/      # Economy commands
│   │   ├── leveling/     # Level commands
│   │   ├── fun/          # Fun commands
│   │   └── utility/      # Utility commands
│   ├── events/           # Discord event handlers
│   ├── database/         # Database models & migrations
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── config/           # Configuration files
│   ├── middleware/       # Middleware functions
│   ├── bot.ts            # Bot class
│   └── index.ts          # Entry point
├── tests/                # Test files
├── docs/                 # Documentation
├── dist/                 # Compiled JavaScript
└── data/                 # Database files
```

## 🔧 Configuration

### Environment Variables

- `DISCORD_TOKEN` - Your Discord bot token (required)
- `DISCORD_CLIENT_ID` - Your Discord application client ID (required)
- `UNSPLASH_ACCESS_KEY` - Unsplash API key for penguin images (optional)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (error/warn/info/debug)
- `DATABASE_PATH` - Database file path (defaults to ./data/pingu.db)

### PM2 Configuration

See `ecosystem.config.js` for PM2 configuration options.

## 📖 Documentation

- [Feature Specification](docs/FEATURE_SPEC.md)
- [Architecture Design](docs/ARCHITECTURE.md)
- [Development Roadmap](docs/ROADMAP.md)

## 🤝 Contributing

This is a learning project. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**slo0ey**
- GitHub: [@BedFriendly](https://github.com/BedFriendly)
- Email: rurchi1206@gmail.com

---

Made with ❤️ and 🐧 by the Pingu Bot team
