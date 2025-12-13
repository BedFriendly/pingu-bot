# Pingu Bot - Railway 배포 가이드

이 문서는 Pingu Bot을 Railway 플랫폼에 배포하는 전체 프로세스를 다룹니다.

## 📋 목차

1. [사전 준비](#사전-준비)
2. [Railway 초기 설정](#railway-초기-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [첫 배포](#첫-배포)
5. [CI/CD 자동화 설정](#cicd-자동화-설정)
6. [PostgreSQL 마이그레이션](#postgresql-마이그레이션)
7. [모니터링 및 로그](#모니터링-및-로그)
8. [롤백 및 트러블슈팅](#롤백-및-트러블슈팅)

---

## 사전 준비

### 1. Railway 계정 생성

1. [Railway 웹사이트](https://railway.app) 방문
2. GitHub 계정으로 로그인 (권장)
3. Hobby Plan 선택 ($5/month - 초기 크레딧 포함)

### 2. Railway CLI 설치

```bash
# npm을 통한 설치
npm install -g @railway/cli

# 버전 확인
railway --version

# Railway 로그인
railway login
```

### 3. Discord Bot 설정 확인

Discord Developer Portal에서 다음을 확인:

- Bot Token 발급 완료
- Client ID 확보
- Gateway Intents 활성화:
  - ✅ Guilds
  - ✅ Guild Messages
  - ✅ Guild Members
  - ✅ Message Content (Privileged Intent)

### 4. 로컬 빌드 테스트

```bash
# 의존성 설치
yarn install

# TypeScript 빌드
yarn build

# 빌드 결과 확인
ls -la dist/
```

---

## Railway 초기 설정

### 방법 1: Railway CLI를 통한 설정

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/pingu-bot

# Railway 프로젝트 초기화
railway init
# 프로젝트 이름 입력: pingu-bot

# 현재 프로젝트와 Railway 연결 확인
railway status
```

### 방법 2: Railway 대시보드를 통한 설정

1. Railway 대시보드 접속
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. `pingu-bot` 저장소 선택
5. 배포 브랜치 설정: `main`

---

## 환경 변수 설정

### Railway CLI로 환경 변수 설정

```bash
# 필수 환경 변수 설정
railway variables set DISCORD_TOKEN="YOUR_BOT_TOKEN_HERE"
railway variables set DISCORD_CLIENT_ID="YOUR_CLIENT_ID_HERE"

# 애플리케이션 설정
railway variables set NODE_ENV="production"
railway variables set LOG_LEVEL="info"

# 데이터베이스 경로 (SQLite 사용 시)
railway variables set DATABASE_PATH="/app/data/pingu.db"

# 선택사항: Unsplash API (펭귄 이미지)
railway variables set UNSPLASH_ACCESS_KEY="YOUR_UNSPLASH_KEY"

# 설정된 변수 확인
railway variables
```

### Railway 대시보드로 환경 변수 설정

1. Railway 프로젝트 선택
2. "Variables" 탭 클릭
3. "New Variable" 버튼 클릭
4. 다음 변수들 추가:

| Variable Name         | Description           | Required |
| --------------------- | --------------------- | -------- |
| `DISCORD_TOKEN`       | Discord 봇 토큰       | ✅       |
| `DISCORD_CLIENT_ID`   | Discord 클라이언트 ID | ✅       |
| `NODE_ENV`            | 환경 (production)     | ✅       |
| `DATABASE_PATH`       | SQLite DB 경로        | ✅       |
| `LOG_LEVEL`           | 로그 레벨 (info)      | ⭕       |
| `UNSPLASH_ACCESS_KEY` | Unsplash API 키       | ⭕       |

---

## 첫 배포

### 수동 배포 (Railway CLI)

```bash
# 1. 코드 빌드 확인
yarn build

# 2. Railway에 배포
railway up

# 3. 배포 진행 상황 확인
railway logs --follow

# 4. 배포 상태 확인
railway status
```

### 자동 배포 (GitHub 연동)

Railway는 GitHub 저장소와 연동하여 자동 배포 가능:

1. **Railway 대시보드 설정:**
   - Settings → "Connect Repo" 클릭
   - `pingu-bot` 저장소 선택
   - 배포 브랜치: `main`

2. **자동 배포 트리거:**

   ```bash
   # main 브랜치에 push하면 자동 배포
   git add .
   git commit -m "feat: 새 기능 추가"
   git push origin main
   ```

3. **배포 확인:**
   - Railway 대시보드 → Deployments 탭에서 진행 상황 확인
   - 또는 CLI로 확인: `railway logs --follow`

### 배포 후 확인 체크리스트

- [ ] Railway 대시보드에서 배포 성공 확인
- [ ] 봇이 Discord에서 온라인 상태인지 확인
- [ ] `/ping` 명령어 테스트
- [ ] `/help` 명령어 테스트
- [ ] 로그에 에러가 없는지 확인

```bash
# 로그 확인
railway logs --tail 100

# 실시간 로그 스트리밍
railway logs --follow
```

---

## CI/CD 자동화 설정

### GitHub Secrets 설정

GitHub Actions를 사용한 자동 배포를 위해 다음 Secrets 추가:

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 다음 Secrets 추가:

| Secret Name          | Value               | Description        |
| -------------------- | ------------------- | ------------------ |
| `RAILWAY_TOKEN`      | Railway API 토큰    | Railway CLI 인증용 |
| `RAILWAY_PROJECT_ID` | Railway 프로젝트 ID | 배포 대상 프로젝트 |

**Railway Token 생성 방법:**

```bash
# Railway CLI로 토큰 생성
railway token

# 또는 Railway 대시보드에서:
# Settings → Tokens → Create Token
```

**Railway Project ID 확인:**

```bash
# CLI로 확인
railway status

# 또는 대시보드에서:
# Project Settings → General → Project ID
```

### CI/CD 파이프라인 동작 방식

프로젝트에는 2개의 GitHub Actions 워크플로우가 설정되어 있습니다:

#### 1. 자동 배포 (`railway-deploy.yml`)

- **트리거:** `main` 또는 `develop` 브랜치에 push
- **프로세스:**
  1. 린트 & 빌드 테스트
  2. Docker 이미지 빌드 검증
  3. `main` → Production 배포
  4. `develop` → Staging 배포

```bash
# main 브랜치에 push
git push origin main
# → 자동으로 프로덕션 배포

# develop 브랜치에 push
git push origin develop
# → 자동으로 스테이징 배포
```

#### 2. 수동 배포 (`manual-deploy.yml`)

- **트리거:** GitHub Actions 탭에서 수동 실행
- **사용 방법:**
  1. GitHub 저장소 → Actions 탭
  2. "수동 배포" 워크플로우 선택
  3. "Run workflow" 클릭
  4. 환경 선택 (staging/production)

---

## PostgreSQL 마이그레이션

현재는 SQLite를 사용하지만, 향후 PostgreSQL로 마이그레이션 예정입니다.

### Railway PostgreSQL 추가

#### Railway 대시보드에서:

1. 프로젝트 선택
2. "New" 버튼 → "Database" → "PostgreSQL"
3. 자동으로 `DATABASE_URL` 환경 변수 생성됨

#### Railway CLI로:

```bash
# PostgreSQL 추가 (대시보드에서 추가하는 것이 더 간편)
# CLI에서는 railway link로 연결만 가능

# DATABASE_URL 확인
railway variables get DATABASE_URL
```

### 로컬에서 Railway PostgreSQL 접속

```bash
# Railway PostgreSQL에 연결
railway connect postgres

# 또는 psql로 직접 접속
railway variables get DATABASE_URL | xargs -I {} psql {}
```

### PostgreSQL 마이그레이션 계획

```bash
# 1. package.json에 pg 의존성 추가
yarn add pg
yarn add -D @types/pg

# 2. 마이그레이션 스크립트 작성 (src/database/migrations/)
# 3. Railway 환경 변수 업데이트
railway variables set DATABASE_URL="postgresql://..."

# 4. 마이그레이션 실행
railway run yarn migrate

# 5. 재배포
railway up
```

---

## 모니터링 및 로그

### Railway 대시보드 모니터링

Railway 대시보드에서 다음을 확인 가능:

- **실시간 로그:** Deployments → 특정 배포 → Logs
- **메트릭:**
  - CPU 사용량
  - 메모리 사용량
  - 네트워크 트래픽
  - 배포 기록

### CLI로 로그 확인

```bash
# 최근 100줄 로그
railway logs --tail 100

# 실시간 로그 스트리밍
railway logs --follow

# 특정 배포의 로그
railway logs --deployment <deployment-id>

# 특정 환경의 로그
railway logs --environment production
```

### 서비스 상태 확인

```bash
# 서비스 상태 확인
railway status

# 서비스 재시작
railway restart

# 특정 환경 재시작
railway restart --environment production
```

### 메트릭 모니터링 팁

- **정상 범위:**
  - CPU: 5-20% (평균)
  - 메모리: 100-300MB (Discord.js 봇 기준)
  - 응답 시간: 50-200ms

- **경고 신호:**
  - CPU 사용률이 지속적으로 80% 이상
  - 메모리 사용량이 400MB 이상
  - 에러 로그가 빈번하게 발생

---

## 롤백 및 트러블슈팅

### 이전 배포로 롤백

#### Railway 대시보드에서:

1. Deployments 탭 선택
2. 이전 성공한 배포 선택
3. "Redeploy" 버튼 클릭

#### Railway CLI로:

```bash
# 배포 기록 확인
railway logs --deployment

# 특정 배포 ID로 롤백
railway redeploy <deployment-id>
```

### Git 커밋으로 롤백

```bash
# 1. 문제가 있는 커밋 되돌리기
git log --oneline
git revert <commit-hash>

# 2. 되돌린 커밋 푸시
git push origin main

# 3. Railway가 자동으로 재배포 (GitHub 연동된 경우)
# 또는 수동 배포
railway up
```

### 긴급 롤백 절차

문제 발생 시 즉시 따를 체크리스트:

1. [ ] Railway 대시보드에서 이전 배포로 롤백
2. [ ] 봇 상태 확인 (`railway logs --follow`)
3. [ ] Discord에서 봇 온라인 상태 확인
4. [ ] 주요 명령어 테스트 (/ping, /help)
5. [ ] 에러 로그 수집 및 분석
6. [ ] 팀에 사고 보고
7. [ ] 문제 원인 분석 및 수정
8. [ ] 테스트 환경에서 재배포 테스트
9. [ ] 프로덕션 재배포

### 트러블슈팅 가이드

#### 문제 1: 봇이 오프라인 상태

**원인:**

- DISCORD_TOKEN이 잘못되었거나 만료됨
- Discord Developer Portal에서 Intents가 비활성화됨
- 코드에 치명적인 에러

**해결:**

```bash
# 1. 환경 변수 확인
railway variables get DISCORD_TOKEN

# 2. 로그 확인
railway logs --tail 100

# 3. Discord Developer Portal에서 Intents 확인
# 4. 로컬에서 테스트
yarn dev
```

#### 문제 2: 데이터베이스 연결 오류

**원인:**

- DATABASE_PATH 또는 DATABASE_URL이 설정되지 않음
- 데이터베이스 파일/서버에 접근 불가

**해결:**

```bash
# SQLite 사용 시
railway variables set DATABASE_PATH="/app/data/pingu.db"

# PostgreSQL 사용 시
railway variables get DATABASE_URL

# Railway PostgreSQL 재시작 (대시보드에서)
```

#### 문제 3: 빌드 실패

**원인:**

- TypeScript 컴파일 에러
- 의존성 설치 실패
- Dockerfile 설정 오류

**해결:**

```bash
# 로컬에서 빌드 테스트
yarn build

# Docker 빌드 테스트
docker build -t pingu-bot-test .

# 로그 확인
railway logs --tail 200
```

#### 문제 4: 메모리 부족 (OOM)

**원인:**

- 메모리 누수
- 캐시가 너무 큼
- Railway Hobby Plan 제한 (512MB)

**해결:**

```bash
# 1. 메모리 사용량 확인 (Railway 대시보드)
# 2. 코드에서 메모리 누수 확인
# 3. 캐시 크기 조정
# 4. 필요시 Railway Pro Plan으로 업그레이드
```

#### 문제 5: CI/CD 파이프라인 실패

**원인:**

- GitHub Secrets 미설정
- RAILWAY_TOKEN 만료
- Railway Project ID 오류

**해결:**

```bash
# 1. GitHub Secrets 확인
# 2. Railway Token 재발급
railway token

# 3. Project ID 확인
railway status

# 4. GitHub Secrets 업데이트
```

---

## 배포 체크리스트

### 배포 전 (Pre-Deployment)

**코드 품질:**

- [ ] 모든 변경사항 커밋 완료
- [ ] TypeScript 빌드 성공 (`yarn build`)
- [ ] 린터 검사 통과 (`yarn lint`)
- [ ] 로컬에서 봇 정상 동작 확인

**환경 설정:**

- [ ] Railway 환경 변수 설정 완료
- [ ] DISCORD_TOKEN 및 CLIENT_ID 확인
- [ ] NODE_ENV=production 설정

**데이터베이스:**

- [ ] 데이터베이스 백업 생성 (중요 데이터가 있다면)
- [ ] 마이그레이션 스크립트 준비 (필요 시)

**배포 계획:**

- [ ] 배포 시간 결정 (트래픽 적은 시간)
- [ ] 팀에 배포 공지
- [ ] 롤백 계획 수립

### 배포 중 (During Deployment)

- [ ] Railway 대시보드에서 배포 진행 상황 모니터링
- [ ] 로그 실시간 확인 (`railway logs --follow`)
- [ ] 빌드 에러 없는지 확인

### 배포 후 (Post-Deployment)

**서비스 상태:**

- [ ] Railway 대시보드에서 배포 성공 확인
- [ ] 봇이 Discord에서 온라인 상태
- [ ] 로그에 에러 없음

**기능 테스트:**

- [ ] /ping 명령어 응답 확인
- [ ] /help 명령어 동작 확인
- [ ] 주요 게임 명령어 테스트
- [ ] 데이터베이스 연결 확인

**모니터링:**

- [ ] CPU/메모리 사용량 정상 범위
- [ ] 30분 이상 안정적 운영 확인

**최종 확인:**

- [ ] 팀에 배포 완료 공지
- [ ] 배포 문서 업데이트 (필요 시)

---

## Railway 비용 최적화

### Hobby Plan 제한 ($5/month)

- **RAM:** 512MB
- **Disk:** 1GB
- **크레딧:** $5/월 포함
- **추가 비용:**
  - RAM: $0.000231/GB-hour
  - Egress: $0.25/GB

### 비용 절감 팁

1. **로그 최소화:**
   - 프로덕션에서 LOG_LEVEL=info 또는 warn
   - 불필요한 console.log 제거

2. **메모리 효율:**
   - 캐시 크기 제한 (node-cache TTL 설정)
   - 사용하지 않는 객체 정리

3. **데이터베이스 최적화:**
   - 효율적인 쿼리 작성
   - 인덱스 활용
   - 불필요한 데이터 정기 삭제

4. **네트워크 트래픽 최소화:**
   - 이미지 API 호출 캐싱
   - 응답 크기 최소화

---

## 참고 자료

- [Railway 공식 문서](https://docs.railway.app)
- [Railway CLI 문서](https://docs.railway.app/develop/cli)
- [Railway Discord 커뮤니티](https://discord.gg/railway)
- [Discord.js v14 문서](https://discord.js.org/#/docs/discord.js/14.14.1/general/welcome)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 문의 및 지원

배포 중 문제가 발생하면 다음을 확인하세요:

1. **로그 확인:** `railway logs --tail 100`
2. **Railway 상태 페이지:** https://railway.statuspage.io
3. **GitHub Issues:** 프로젝트의 Issues 탭에서 검색
4. **Railway Discord:** 커뮤니티에 질문

---

**작성일:** 2024-12-13
**버전:** 1.0.0
**마지막 업데이트:** Railway 배포 초기 설정 완료
