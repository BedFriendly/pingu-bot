# PostgreSQL 데이터베이스 설정 가이드

Pingu Bot의 PostgreSQL 데이터베이스 구축 및 관리 가이드입니다.

## 목차

1. [데이터베이스 구조](#데이터베이스-구조)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [마이그레이션 실행](#마이그레이션-실행)
4. [배포 환경 설정](#배포-환경-설정)
5. [모델 사용법](#모델-사용법)

## 데이터베이스 구조

### 테이블 구조

#### users
- `user_id` (VARCHAR(20), PK): 디스코드 사용자 ID
- `username` (VARCHAR(32)): 사용자 이름
- `coins` (INTEGER): 보유 코인 (PC)
- `experience` (INTEGER): 경험치
- `level` (INTEGER): 레벨
- `total_wins` (INTEGER): 총 승리 횟수
- `total_games` (INTEGER): 총 게임 횟수
- `last_daily` (TIMESTAMP): 마지막 일일 보상 수령 시간
- `created_at` (TIMESTAMP): 생성 시간
- `updated_at` (TIMESTAMP): 수정 시간

#### guilds
- `guild_id` (VARCHAR(20), PK): 디스코드 길드 ID
- `guild_name` (VARCHAR(100)): 길드 이름
- `prefix` (VARCHAR(10)): 명령어 접두사
- `level_channel_id` (VARCHAR(20)): 레벨업 알림 채널 ID
- `welcome_channel_id` (VARCHAR(20)): 환영 메시지 채널 ID
- `language` (VARCHAR(5)): 언어 설정 (ko, en 등)
- `created_at` (TIMESTAMP): 생성 시간
- `updated_at` (TIMESTAMP): 수정 시간

#### game_stats
- `id` (SERIAL, PK): 게임 기록 ID
- `user_id` (VARCHAR(20), FK): 사용자 ID
- `game_type` (VARCHAR(20)): 게임 타입 (rps, coinflip, guess, dice)
- `result` (VARCHAR(10)): 게임 결과 (win, loss, draw)
- `bet_amount` (INTEGER): 베팅 금액
- `profit` (INTEGER): 손익
- `played_at` (TIMESTAMP): 게임 플레이 시간

#### cooldowns
- `id` (SERIAL, PK): 쿨다운 ID
- `user_id` (VARCHAR(20)): 사용자 ID
- `command_name` (VARCHAR(50)): 명령어 이름
- `expires_at` (TIMESTAMP): 만료 시간

## 로컬 개발 환경 설정

### 1. PostgreSQL 설치

#### Windows
```bash
# Chocolatey 사용
choco install postgresql

# 또는 공식 사이트에서 다운로드
# https://www.postgresql.org/download/windows/
```

#### macOS
```bash
# Homebrew 사용
brew install postgresql@16
brew services start postgresql@16
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE pingu_bot;

# 사용자 생성 (선택사항)
CREATE USER pingu_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pingu_bot TO pingu_user;

# 종료
\q
```

### 3. 환경 변수 설정

`.env` 파일에 데이터베이스 연결 정보를 설정합니다:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pingu_bot
```

예시:
```env
# 기본 postgres 사용자 사용
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pingu_bot

# 별도 사용자 생성한 경우
DATABASE_URL=postgresql://pingu_user:your_password@localhost:5432/pingu_bot
```

## 마이그레이션 실행

### 초기 마이그레이션

```bash
# yarn 사용
yarn migrate

# 또는
yarn db:migrate

# npm 사용
npm run migrate
```

마이그레이션은 다음 작업을 수행합니다:
1. 데이터베이스 연결 확인
2. `migrations` 테이블 생성 (이미 실행된 마이그레이션 추적용)
3. 모든 테이블 생성 (users, guilds, game_stats, cooldowns)
4. 인덱스 생성 (성능 최적화)
5. 트리거 생성 (updated_at 자동 업데이트)

### 마이그레이션 확인

```bash
# PostgreSQL 접속
psql -U postgres -d pingu_bot

# 테이블 목록 확인
\dt

# 특정 테이블 구조 확인
\d users

# 마이그레이션 기록 확인
SELECT * FROM migrations;
```

## 배포 환경 설정

### Railway 배포

Railway는 PostgreSQL을 자동으로 프로비저닝하고 `DATABASE_URL` 환경 변수를 설정합니다.

1. Railway 대시보드에서 PostgreSQL 추가
2. `DATABASE_URL`이 자동으로 설정됨
3. 배포 후 마이그레이션 실행:

```bash
# Railway CLI 사용
railway run yarn migrate

# 또는 빌드 스크립트에 추가 (package.json)
"scripts": {
  "deploy": "yarn build && yarn migrate && yarn start"
}
```

### Fly.io 배포

```bash
# PostgreSQL 앱 생성
fly postgres create

# 연결 (자동으로 DATABASE_URL 설정됨)
fly postgres attach <postgres-app-name>

# 배포
fly deploy

# 마이그레이션 실행
fly ssh console
yarn migrate
exit
```

### 환경 변수

배포 환경에서는 다음 환경 변수가 필요합니다:

```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
```

## 모델 사용법

### User 모델

```typescript
import { UserModel } from './database/models';

// 사용자 조회 또는 생성
const user = await UserModel.findOrCreate('123456789', 'PinguUser');

// 코인 추가
await UserModel.addCoins(user.user_id, 100);

// 경험치 추가 (레벨업 자동 처리)
const { user: updatedUser, leveledUp, newLevel } = await UserModel.addExperience(
  user.user_id,
  50
);

if (leveledUp) {
  console.log(`레벨업! 새 레벨: ${newLevel}`);
}

// 일일 보상
await UserModel.updateDaily(user.user_id);

// 리더보드 조회
const topByCoins = await UserModel.getLeaderboardByCoins(10);
const topByLevel = await UserModel.getLeaderboardByLevel(10);
```

### Guild 모델

```typescript
import { GuildModel } from './database/models';

// 길드 조회 또는 생성
const guild = await GuildModel.findOrCreate('987654321', 'My Server');

// 설정 업데이트
await GuildModel.setPrefix(guild.guild_id, '!');
await GuildModel.setLevelChannel(guild.guild_id, '123456789');
await GuildModel.setLanguage(guild.guild_id, 'ko');
```

### GameStats 모델

```typescript
import { GameStatsModel } from './database/models';

// 게임 기록 생성
await GameStatsModel.create({
  user_id: '123456789',
  game_type: 'rps',
  result: 'win',
  bet_amount: 100,
  profit: 100,
});

// 사용자 게임 통계 조회
const stats = await GameStatsModel.getUserStats('123456789');
console.log(`승률: ${stats.winRate}%`);

// 게임 타입별 통계
const rpsStats = await GameStatsModel.getGameTypeStats('123456789', 'rps');

// 전체 리더보드
const globalStats = await GameStatsModel.getGlobalStats('rps', 10);
```

### 트랜잭션 사용

```typescript
import { db } from './database';

// 트랜잭션으로 여러 작업 묶기
await db.transaction(async (client) => {
  // 코인 차감
  await client.query('UPDATE users SET coins = coins - $1 WHERE user_id = $2', [
    100,
    userId,
  ]);

  // 게임 기록 생성
  await client.query(
    'INSERT INTO game_stats (user_id, game_type, result, bet_amount, profit) VALUES ($1, $2, $3, $4, $5)',
    [userId, 'dice', 'win', 100, 100]
  );

  // 승수 증가
  await client.query(
    'UPDATE users SET total_wins = total_wins + 1, total_games = total_games + 1 WHERE user_id = $1',
    [userId]
  );
});
```

## 데이터베이스 유지보수

### 백업

```bash
# 데이터베이스 백업
pg_dump -U postgres pingu_bot > backup.sql

# 압축 백업
pg_dump -U postgres pingu_bot | gzip > backup.sql.gz
```

### 복원

```bash
# 백업 복원
psql -U postgres pingu_bot < backup.sql

# 압축 백업 복원
gunzip -c backup.sql.gz | psql -U postgres pingu_bot
```

### 성능 모니터링

```sql
-- 느린 쿼리 확인
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- 인덱스 사용률 확인
SELECT * FROM pg_stat_user_indexes;

-- 테이블 크기 확인
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 문제 해결

### 연결 실패

```bash
# PostgreSQL 실행 확인
sudo systemctl status postgresql  # Linux
brew services list  # macOS
net start postgresql-x64-16  # Windows

# 포트 확인
netstat -an | grep 5432
```

### 권한 문제

```sql
-- 사용자에게 모든 권한 부여
GRANT ALL PRIVILEGES ON DATABASE pingu_bot TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### 마이그레이션 실패

```bash
# 마이그레이션 테이블 초기화 (주의: 모든 기록 삭제됨)
psql -U postgres -d pingu_bot -c "DROP TABLE IF EXISTS migrations;"

# 다시 마이그레이션 실행
yarn migrate
```

## 추가 정보

- PostgreSQL 공식 문서: https://www.postgresql.org/docs/
- node-postgres (pg) 문서: https://node-postgres.com/
- Railway PostgreSQL: https://docs.railway.app/databases/postgresql
- Fly.io PostgreSQL: https://fly.io/docs/postgres/
