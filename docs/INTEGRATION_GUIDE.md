# 데이터베이스 통합 가이드

Pingu Bot의 PostgreSQL 데이터베이스 통합이 완료되었습니다. 이 문서는 통합된 내용과 사용 방법을 설명합니다.

## 통합 개요

### 변경된 파일

#### 1. 핵심 봇 파일
- **src/index.ts**: 데이터베이스 연결 종료 처리 추가
- **src/bot.ts**: 데이터베이스 초기화 메서드 추가

#### 2. 이벤트 핸들러
- **src/events/ready.ts**: 데이터베이스 연결 상태 확인
- **src/events/interactionCreate.ts**: 사용자/길드 자동 생성

#### 3. 커맨드
- **src/commands/utility/ping.ts**: 데이터베이스 레이턴시 측정 추가
- **src/commands/utility/help.ts**: 사용자 정보(코인, 레벨) 표시 추가
- **src/commands/economy/balance.ts**: 사용자 정보 조회 커맨드 (신규)

## 자동화된 기능

### 1. 봇 시작 시 데이터베이스 연결

봇이 시작될 때 자동으로:
- 데이터베이스 연결 확인
- 연결 실패 시 에러와 함께 봇 종료
- 연결 성공 시 로그 출력

```typescript
// src/bot.ts
private async initializeDatabase(): Promise<void> {
  logger.info('Initializing database connection...');
  const connected = await db.testConnection();

  if (!connected) {
    throw new Error('Failed to connect to database');
  }

  logger.info('Database connection established successfully');
}
```

### 2. 사용자/길드 자동 생성

커맨드 실행 시 자동으로:
- 사용자가 데이터베이스에 없으면 생성
- 길드에서 실행된 경우 길드도 생성
- 기본값으로 초기화 (코인: 0, 레벨: 1 등)

```typescript
// src/events/interactionCreate.ts
await UserModel.findOrCreate(interaction.user.id, interaction.user.username);

if (interaction.guild) {
  await GuildModel.findOrCreate(interaction.guild.id, interaction.guild.name);
}
```

### 3. Graceful Shutdown

봇 종료 시 자동으로:
- Discord 연결 종료
- 데이터베이스 연결 풀 종료
- 진행 중인 쿼리 완료 대기

```typescript
// src/index.ts
process.on('SIGINT', async () => {
  bot.destroy();
  await db.close();
  process.exit(0);
});
```

## 데이터베이스 연동 커맨드 작성 예시

### 기본 패턴

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/command';
import { UserModel } from '../../database/models';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('명령어 설명'),
  category: 'economy', // 또는 games, leveling, fun, utility
  cooldown: 5, // 초 단위
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      // 1. 사용자 정보 조회
      const user = await UserModel.findById(interaction.user.id);

      if (!user) {
        await interaction.reply({
          content: '❌ 사용자 정보를 찾을 수 없습니다.',
          ephemeral: true,
        });
        return;
      }

      // 2. 비즈니스 로직 실행
      // ...

      // 3. 응답 전송
      await interaction.reply({
        content: '✅ 성공!',
      });
    } catch (error) {
      await interaction.reply({
        content: '❌ 오류가 발생했습니다.',
        ephemeral: true,
      });
    }
  },
};

export default command;
```

### 코인 지급/차감 예시

```typescript
// 코인 추가
await UserModel.addCoins(userId, 100); // +100 PC

// 코인 차감
await UserModel.addCoins(userId, -50); // -50 PC

// 직접 업데이트
await UserModel.update(userId, { coins: 500 });
```

### 경험치 및 레벨업 예시

```typescript
// 경험치 추가 (레벨업 자동 처리)
const { user, leveledUp, newLevel } = await UserModel.addExperience(userId, 25);

if (leveledUp) {
  await interaction.channel.send(
    `🎉 축하합니다! ${interaction.user}님이 레벨 ${newLevel}에 도달했습니다!`
  );
}
```

### 게임 기록 저장 예시

```typescript
import { GameStatsModel } from '../../database/models';

// 게임 결과 저장
await GameStatsModel.create({
  user_id: interaction.user.id,
  game_type: 'rps', // 'rps', 'coinflip', 'guess', 'dice'
  result: 'win', // 'win', 'loss', 'draw'
  bet_amount: 100,
  profit: 100, // 승리시 양수, 패배시 음수
});

// 게임 통계 조회
const stats = await GameStatsModel.getUserStats(interaction.user.id);
console.log(`승률: ${stats.winRate}%`);
```

### 트랜잭션 사용 예시

여러 작업을 원자적으로 처리해야 하는 경우:

```typescript
import { db } from '../../database';

await db.transaction(async (client) => {
  // 코인 차감
  await client.query(
    'UPDATE users SET coins = coins - $1 WHERE user_id = $2',
    [betAmount, userId]
  );

  // 게임 기록 생성
  await client.query(
    'INSERT INTO game_stats (user_id, game_type, result, bet_amount, profit) VALUES ($1, $2, $3, $4, $5)',
    [userId, 'dice', 'win', betAmount, betAmount]
  );

  // 승수 증가
  await client.query(
    'UPDATE users SET total_wins = total_wins + 1, total_games = total_games + 1 WHERE user_id = $1',
    [userId]
  );
});
```

## 실제 사용 예시

### 1. /ping 커맨드

데이터베이스 레이턴시 측정:
```
🏓 Pong!
📡 Roundtrip Latency: `45ms`
⚡ WebSocket Latency: `35ms`
💾 Database Latency: `12ms`
```

### 2. /help 커맨드

사용자 정보 표시:
```
Here are all available commands:
💰 Coins: **1000 PC** | ⬆️ Level: **5** (750 XP)
```

### 3. /balance 커맨드

상세한 사용자 정보:
```
💰 PinguUser님의 정보

💵 잔액: 1,000 PC
⬆️ 레벨: 5
✨ 경험치: 750 / 1,118 XP
📊 진행도: ████████████░░░░░░░░ 67.1%
🎮 게임 통계:
  총 게임: 25회
  승리: 15회
  승률: 60.0%
🎁 일일 보상: 마지막 수령: 2시간 전
```

## 환경 설정

### .env 파일

```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_client_id

# Database - PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/pingu_bot

# Environment
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

### 마이그레이션 실행

```bash
# 로컬 개발 환경
yarn migrate

# 프로덕션 환경 (Railway)
railway run yarn migrate

# 프로덕션 환경 (Fly.io)
fly ssh console
yarn migrate
exit
```

## 개발 워크플로우

### 1. 새로운 테이블 추가

1. `src/database/schema.sql`에 테이블 정의 추가
2. `src/types/database.ts`에 인터페이스 추가
3. `src/database/migrations/`에 새 마이그레이션 파일 생성
4. `src/database/models/`에 모델 클래스 생성
5. `src/database/models/index.ts`에서 export

### 2. 새로운 커맨드 작성

1. 적절한 카테고리 디렉토리에 파일 생성
2. 필요한 모델 import
3. 데이터베이스 조회/수정 로직 구현
4. 에러 처리 추가
5. 빌드 및 테스트

```bash
# 개발 모드로 봇 실행
yarn dev

# 빌드
yarn build

# 프로덕션 실행
yarn start
```

## 주의사항

### 1. 에러 처리

데이터베이스 오류가 발생해도 봇이 중단되지 않도록:

```typescript
try {
  const user = await UserModel.findById(userId);
  // ...
} catch (error) {
  logger.error('Database error:', error);
  await interaction.reply({
    content: '❌ 오류가 발생했습니다.',
    ephemeral: true,
  });
}
```

### 2. SQL Injection 방지

항상 파라미터화된 쿼리 사용:

```typescript
// ✅ 안전
await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);

// ❌ 위험
await db.query(`SELECT * FROM users WHERE user_id = '${userId}'`);
```

### 3. 트랜잭션 사용

여러 작업이 연관된 경우 트랜잭션 사용:

```typescript
// ✅ 트랜잭션 사용
await db.transaction(async (client) => {
  await client.query('UPDATE users SET coins = coins - 100 WHERE user_id = $1', [userId]);
  await client.query('INSERT INTO game_stats (...) VALUES (...)', [...]);
});

// ❌ 별도 쿼리 (중간에 실패하면 데이터 불일치)
await db.query('UPDATE users SET coins = coins - 100 WHERE user_id = $1', [userId]);
await db.query('INSERT INTO game_stats (...) VALUES (...)', [...]);
```

### 4. 인덱스 활용

자주 조회하는 컬럼에는 인덱스가 이미 설정되어 있습니다:
- users.coins (DESC)
- users.level (DESC)
- users.total_wins (DESC)
- game_stats.user_id
- game_stats.played_at (DESC)

## 다음 단계

이제 다음 기능들을 구현할 수 있습니다:

1. **경제 시스템**:
   - `/daily` - 일일 보상
   - `/pay` - 코인 전송
   - `/leaderboard` - 리더보드

2. **미니 게임**:
   - `/dice` - 주사위 게임
   - `/rps` - 가위바위보
   - `/coinflip` - 동전 던지기
   - `/guess` - 숫자 맞추기

3. **레벨링 시스템**:
   - 메시지 XP 획득 (messageCreate 이벤트)
   - `/level` - 레벨 확인
   - 레벨업 알림

4. **서버 관리**:
   - 길드 설정 커맨드
   - 환영 메시지
   - 레벨업 채널 설정

## 문제 해결

### 데이터베이스 연결 실패

```bash
# PostgreSQL 실행 확인
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# 연결 문자열 확인
echo $DATABASE_URL
```

### 마이그레이션 오류

```bash
# 마이그레이션 테이블 초기화
psql -U postgres -d pingu_bot -c "DROP TABLE IF EXISTS migrations;"

# 다시 실행
yarn migrate
```

### 타입 오류

```bash
# 타입 정의 다시 로드
yarn build

# node_modules 재설치
rm -rf node_modules
yarn install
```

## 참고 자료

- [DATABASE.md](./DATABASE.md) - 데이터베이스 상세 가이드
- [CLAUDE.md](./.claude/CLAUDE.md) - 프로젝트 전체 구조
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [node-postgres 문서](https://node-postgres.com/)
