# Pingu Bot - Railway 빠른 시작 가이드 ⚡

Railway에 Pingu Bot을 처음 배포하는 경우, 이 가이드를 따라하세요.

## 📌 5분 안에 배포하기

### 1단계: Railway 계정 및 로그인

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인 (GitHub 계정 권장)
railway login
```

### 2단계: Railway 프로젝트 생성

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/pingu-bot

# Railway 프로젝트 초기화
railway init
# 프로젝트 이름 입력: pingu-bot

# 프로젝트 연결 확인
railway status
```

### 3단계: 환경 변수 설정

```bash
# Discord 봇 설정 (필수)
railway variables --set DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN"
railway variables --set DISCORD_CLIENT_ID="YOUR_CLIENT_ID"

# 애플리케이션 설정
railway variables --set NODE_ENV="production"
railway variables --set LOG_LEVEL="info"
railway variables --set DATABASE_PATH="/app/data/pingu.db"

# 설정 확인
railway variables
```

### 4단계: 첫 배포

```bash
# 코드 빌드 테스트
yarn build

# Railway에 배포
railway up

# 배포 로그 확인
railway logs --follow
```

### 5단계: 배포 확인

```bash
# 배포 상태 확인
railway status

# Discord에서 봇이 온라인인지 확인
# 테스트 명령어: /ping
```

## ✅ 완료!

봇이 성공적으로 배포되었습니다! 🎉

---

## 🔧 다음 단계 (선택사항)

### GitHub 자동 배포 설정

1. **Railway 대시보드 설정:**
   - Railway 프로젝트 → Settings
   - "Connect Repo" 클릭
   - `pingu-bot` 저장소 선택
   - 배포 브랜치: `main`

2. **자동 배포 테스트:**
   ```bash
   # main 브랜치에 push하면 자동 배포
   git add .
   git commit -m "test: 자동 배포 테스트"
   git push origin main
   ```

### CI/CD 파이프라인 활성화

1. **GitHub Secrets 추가:**
   - Repository → Settings → Secrets and variables → Actions
   - `RAILWAY_TOKEN` 추가:
     ```bash
     railway token
     ```
   - `RAILWAY_PROJECT_ID` 추가:
     ```bash
     railway status  # Project ID 확인
     ```

2. **자동 배포 확인:**
   - `main` 브랜치 push → 자동 프로덕션 배포
   - `develop` 브랜치 push → 자동 스테이징 배포

---

## 🐛 트러블슈팅

### 봇이 오프라인 상태

```bash
# 로그 확인
railway logs --tail 100

# 환경 변수 확인
railway variables get DISCORD_TOKEN

# 서비스 재시작
railway restart
```

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
yarn install
yarn build

# Docker 빌드 테스트
docker build -t pingu-bot-test .
```

### 데이터베이스 연결 오류

```bash
# DATABASE_PATH 확인
railway variables get DATABASE_PATH

# 재설정
railway variables set DATABASE_PATH="/app/data/pingu.db"
```

---

## 📚 상세 가이드

더 자세한 내용은 다음 문서를 참조하세요:s

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 전체 배포 가이드
- **[Railway 공식 문서](https://docs.railway.app)** - Railway 플랫폼 문서

---

**작성일:** 2025-12-13
**버전:** 1.0.0
