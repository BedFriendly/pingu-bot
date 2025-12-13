# ==============================
# Pingu Bot - Railway Dockerfile
# ==============================

# Build stage
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# Yarn 설치 (alpine에는 기본 포함되지 않음)
RUN corepack enable && corepack prepare yarn@1.22.19 --activate

# 패키지 파일 복사
COPY package.json yarn.lock ./

# 의존성 설치 (devDependencies 포함 - TypeScript 빌드용)
RUN yarn install --frozen-lockfile

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN yarn build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Yarn 설치
RUN corepack enable && corepack prepare yarn@1.22.19 --activate

# 프로덕션 사용자 생성 (보안)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pingubot -u 1001

# 패키지 파일 복사
COPY package.json yarn.lock ./

# 프로덕션 의존성만 설치
RUN yarn install --production --frozen-lockfile && yarn cache clean

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 데이터 디렉토리 생성 (SQLite용)
RUN mkdir -p /app/data && chown -R pingubot:nodejs /app

# 프로덕션 사용자로 전환
USER pingubot

# Health check (선택사항 - 추후 HTTP endpoint 추가 시)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD node -e "console.log('healthy')" || exit 1

# 봇 실행
CMD ["node", "dist/index.js"]
