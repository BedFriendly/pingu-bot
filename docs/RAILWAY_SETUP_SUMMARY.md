# Railway 배포 설정 완료 ✅

Pingu Bot의 Railway 배포 설정이 완료되었습니다. 아래는 생성된 파일들과 다음 단계입니다.

## 📦 생성된 파일들

### 1. Docker 설정

- **`Dockerfile`** - Railway 배포용 최적화된 멀티스테이지 Dockerfile
- **`.dockerignore`** - Docker 빌드에서 제외할 파일 목록

### 2. Railway 설정

- **`railway.json`** - Railway 배포 설정 (Dockerfile 빌드 방식)
- **`.env.production.example`** - 프로덕션 환경 변수 예시

### 3. CI/CD 파이프라인

- **`.github/workflows/railway-deploy.yml`** - 자동 배포 워크플로우
  - main → Production 배포
  - develop → Staging 배포
- **`.github/workflows/manual-deploy.yml`** - 수동 배포 워크플로우

### 4. 문서

- **`docs/DEPLOYMENT.md`** - 전체 배포 프로세스 문서
- **`docs/QUICK_START_RAILWAY.md`** - 5분 빠른 시작 가이드

### 5. 스크립트

- **`scripts/railway-backup.sh`** - 데이터베이스 백업 스크립트 (실행 권한 부여됨)

### 6. 업데이트된 파일

- **`README.md`** - Railway 배포 섹션 추가

## 🚀 다음 단계

### 1단계: Railway CLI 설치

```bash
npm install -g @railway/cli
railway login
```

### 2단계: Railway 프로젝트 초기화

```bash
cd /Users/denfade/Desktop/project/pingu-bot
railway init
```

### 3단계: 환경 변수 설정

```bash
# 필수 변수
railway variables set DISCORD_TOKEN="YOUR_BOT_TOKEN"
railway variables set DISCORD_CLIENT_ID="YOUR_CLIENT_ID"
railway variables set NODE_ENV="production"
railway variables set LOG_LEVEL="info"
railway variables set DATABASE_PATH="/app/data/pingu.db"

# 선택사항
railway variables set UNSPLASH_ACCESS_KEY="YOUR_KEY"
```

### 4단계: 첫 배포

```bash
# 로컬 빌드 테스트
yarn build

# Railway에 배포
railway up

# 배포 로그 확인
railway logs --follow
```

### 5단계: 배포 확인

- [ ] Railway 대시보드에서 배포 성공 확인
- [ ] Discord에서 봇 온라인 상태 확인
- [ ] `/ping` 명령어 테스트
- [ ] `/help` 명령어 테스트

## 📚 참고 문서

배포 중 문제가 발생하면 다음 문서를 확인하세요:

1. **빠른 시작**: [docs/QUICK_START_RAILWAY.md](docs/QUICK_START_RAILWAY.md)
2. **전체 가이드**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
3. **트러블슈팅**: [docs/DEPLOYMENT.md#롤백-및-트러블슈팅](docs/DEPLOYMENT.md#롤백-및-트러블슈팅)

## 🔐 GitHub Secrets 설정 (CI/CD용)

자동 배포를 위해 GitHub Secrets를 설정하세요:

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 Secrets 추가:

```bash
# RAILWAY_TOKEN 생성
railway token

# RAILWAY_PROJECT_ID 확인
railway status
```

| Secret Name          | 값                  |
| -------------------- | ------------------- |
| `RAILWAY_TOKEN`      | Railway API 토큰    |
| `RAILWAY_PROJECT_ID` | Railway 프로젝트 ID |

## ✅ 체크리스트

### 배포 전

- [ ] Discord Bot Token 준비
- [ ] Railway 계정 생성
- [ ] Railway CLI 설치
- [ ] 로컬 빌드 테스트 (`yarn build`)

### 배포

- [ ] Railway 프로젝트 생성 (`railway init`)
- [ ] 환경 변수 설정 (`railway variables set ...`)
- [ ] 첫 배포 (`railway up`)

### 배포 후

- [ ] 봇 온라인 상태 확인
- [ ] 명령어 테스트
- [ ] 로그 확인 (`railway logs --tail 100`)

### CI/CD (선택사항)

- [ ] GitHub 저장소 연결 (Railway 대시보드)
- [ ] GitHub Secrets 설정
- [ ] 자동 배포 테스트 (git push)

## 🎯 권장 배포 플로우

### 개발 환경

```bash
# 로컬 개발
yarn dev
```

### 스테이징 환경 (develop 브랜치)

```bash
git checkout develop
git push origin develop
# → GitHub Actions가 자동으로 Staging 배포
```

### 프로덕션 환경 (main 브랜치)

```bash
git checkout main
git merge develop
git push origin main
# → GitHub Actions가 자동으로 Production 배포
```

## 📊 Railway 대시보드 활용

배포 후 Railway 대시보드에서 다음을 확인하세요:

- **Deployments**: 배포 기록 및 로그
- **Metrics**: CPU, 메모리, 네트워크 사용량
- **Variables**: 환경 변수 관리
- **Settings**: GitHub 연동, 도메인 설정 등

## 💡 유용한 명령어

```bash
# 배포 상태 확인
railway status

# 실시간 로그
railway logs --follow

# 환경 변수 확인
railway variables

# 서비스 재시작
railway restart

# 데이터베이스 백업 (스크립트 사용)
./scripts/railway-backup.sh
```

## 🐛 문제 해결

### 봇이 오프라인

```bash
railway logs --tail 100
railway variables get DISCORD_TOKEN
railway restart
```

### 빌드 실패

```bash
yarn build  # 로컬 테스트
docker build -t pingu-bot-test .  # Docker 테스트
```

### 데이터베이스 오류

```bash
railway variables get DATABASE_PATH
railway variables set DATABASE_PATH="/app/data/pingu.db"
```

---

**작성일**: 2024-12-13  
**버전**: 1.0.0  
**다음 읽을 문서**: [docs/QUICK_START_RAILWAY.md](docs/QUICK_START_RAILWAY.md)
