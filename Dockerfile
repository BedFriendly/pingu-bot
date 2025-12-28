# ==============================
# Pingu Bot - Railway Dockerfile
# ==============================

# Build stage
FROM node:20.19.6-slim AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package.json yarn.lock ./

# openssl 설치
RUN apt-get update
RUN apt-get install -y openssl

# 의존성 설치 (devDependencies 포함 - TypeScript 빌드용)
RUN yarn install --frozen-lockfile

# 소스 코드 복사
COPY . .

# prisma client 생성
RUN yarn prisma:generate

# 기존 빌드 삭제
RUN rm -rf dist

# TypeScript 빌드
RUN yarn build

# Production stage
FROM node:20.19.6-slim

WORKDIR /app

# 프로덕션 사용자 생성 (보안)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 pingubot

# 패키지 파일 복사
COPY package.json yarn.lock ./

# openssl 설치
RUN apt-get update
RUN apt-get install -y openssl

# 프로덕션 의존성만 설치
RUN yarn install --production --frozen-lockfile && yarn cache clean

# prisma 스키마 복사
COPY --from=builder /app/prisma ./prisma

# prisma client 생성
RUN yarn prisma:generate

# 빌드된 JavaScript 파일만 복사 (TypeScript 파일 제외)
COPY --from=builder /app/dist ./dist

# .ts 파일이 혹시 남아있다면 제거 (프로덕션에서는 .js만 필요)
RUN find /app/dist -name "*.ts" ! -name "*.d.ts" -type f -delete || true
# 프로덕션 사용자로 전환
USER pingubot

# Health check (선택사항 - 추후 HTTP endpoint 추가 시)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD node -e "console.log('healthy')" || exit 1

# 봇 실행
CMD ["node", "dist/index.js"]
