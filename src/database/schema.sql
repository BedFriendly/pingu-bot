-- Pingu Bot PostgreSQL 데이터베이스 스키마
-- 작성일: 2025-12-14

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(20) PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  total_wins INTEGER NOT NULL DEFAULT 0 CHECK (total_wins >= 0),
  total_games INTEGER NOT NULL DEFAULT 0 CHECK (total_games >= 0),
  last_daily TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 길드(서버) 테이블
CREATE TABLE IF NOT EXISTS guilds (
  guild_id VARCHAR(20) PRIMARY KEY,
  guild_name VARCHAR(100) NOT NULL,
  prefix VARCHAR(10) NOT NULL DEFAULT '!',
  level_channel_id VARCHAR(20),
  welcome_channel_id VARCHAR(20),
  language VARCHAR(5) NOT NULL DEFAULT 'ko',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 게임 통계 테이블
CREATE TABLE IF NOT EXISTS game_stats (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('rps', 'coinflip', 'guess', 'dice')),
  result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  bet_amount INTEGER NOT NULL CHECK (bet_amount >= 0),
  profit INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 쿨다운 테이블 (메모리 캐시로 대체 가능, 하지만 재시작시 유지를 위해 DB에 저장)
CREATE TABLE IF NOT EXISTS cooldowns (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  command_name VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE (user_id, command_name)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_coins ON users(coins DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_wins ON users(total_wins DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_played_at ON game_stats(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_cooldowns_user_command ON cooldowns(user_id, command_name);
CREATE INDEX IF NOT EXISTS idx_cooldowns_expires_at ON cooldowns(expires_at);

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- guilds 테이블에 트리거 적용
CREATE TRIGGER update_guilds_updated_at
  BEFORE UPDATE ON guilds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 만료된 쿨다운 자동 삭제 함수 (선택사항)
CREATE OR REPLACE FUNCTION delete_expired_cooldowns()
RETURNS void AS $$
BEGIN
  DELETE FROM cooldowns WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 주석 추가
COMMENT ON TABLE users IS '디스코드 사용자 정보 및 봇 관련 데이터';
COMMENT ON TABLE guilds IS '디스코드 서버(길드) 설정';
COMMENT ON TABLE game_stats IS '게임 플레이 기록 및 통계';
COMMENT ON TABLE cooldowns IS '커맨드 쿨다운 관리';
