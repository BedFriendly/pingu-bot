#!/bin/bash

# ==============================
# Railway 데이터베이스 백업 스크립트
# ==============================
# 사용법: ./scripts/railway-backup.sh

set -e  # 에러 발생 시 중단

# 설정
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-}"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 에러 메시지 출력
error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

# 함수: 경고 메시지 출력
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 함수: 성공 메시지 출력
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Railway CLI 설치 확인
if ! command -v railway &> /dev/null; then
    error "Railway CLI가 설치되어 있지 않습니다. 'npm install -g @railway/cli'로 설치하세요."
fi

# Railway 로그인 확인
if [ -z "$RAILWAY_TOKEN" ]; then
    warn "RAILWAY_TOKEN 환경 변수가 설정되지 않았습니다."
    echo "Railway CLI로 로그인을 시도합니다..."
    railway login || error "Railway 로그인 실패"
fi

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

echo "==============================="
echo "Railway 데이터베이스 백업 시작"
echo "==============================="
echo "타임스탬프: $TIMESTAMP"
echo ""

# 데이터베이스 타입 확인
DB_TYPE=$(railway variables get DATABASE_URL 2>/dev/null | grep -q "^postgresql://" && echo "postgresql" || echo "sqlite")

if [ "$DB_TYPE" = "postgresql" ]; then
    # PostgreSQL 백업
    echo "데이터베이스 타입: PostgreSQL"

    # psql 설치 확인
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump가 설치되어 있지 않습니다. PostgreSQL 클라이언트를 설치하세요."
    fi

    # DATABASE_URL 가져오기
    DATABASE_URL=$(railway variables get DATABASE_URL)

    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL을 가져올 수 없습니다."
    fi

    # PostgreSQL 백업 실행
    echo "PostgreSQL 백업 중..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

    # 압축
    echo "백업 파일 압축 중..."
    gzip "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

    BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

elif [ "$DB_TYPE" = "sqlite" ]; then
    # SQLite 백업
    echo "데이터베이스 타입: SQLite"

    # SQLite 파일 경로 확인
    DB_PATH=$(railway variables get DATABASE_PATH)

    if [ -z "$DB_PATH" ]; then
        warn "DATABASE_PATH가 설정되지 않았습니다. 기본값 사용: /app/data/pingu.db"
        DB_PATH="/app/data/pingu.db"
    fi

    # Railway 서비스에서 SQLite 파일 다운로드
    # (Railway는 파일 시스템 접근이 제한적이므로, 로컬 개발용으로 사용)
    warn "SQLite 백업은 로컬 개발 환경에서만 지원됩니다."
    warn "프로덕션 환경에서는 PostgreSQL 사용을 권장합니다."

    if [ -f "data/pingu.db" ]; then
        cp "data/pingu.db" "$BACKUP_DIR/backup_${TIMESTAMP}.db"
        gzip "$BACKUP_DIR/backup_${TIMESTAMP}.db"
        BACKUP_FILE="backup_${TIMESTAMP}.db.gz"
    else
        error "로컬 SQLite 파일을 찾을 수 없습니다: data/pingu.db"
    fi
else
    error "알 수 없는 데이터베이스 타입"
fi

# 백업 파일 크기 확인
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
success "백업 완료: $BACKUP_FILE (크기: $BACKUP_SIZE)"

# 오래된 백업 삭제 (7일 이상)
echo ""
echo "오래된 백업 정리 중 (7일 이상)..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +7 -delete 2>/dev/null || true
success "오래된 백업 정리 완료"

# 백업 파일 목록 출력
echo ""
echo "현재 백업 목록:"
ls -lh "$BACKUP_DIR/backup_"*.gz 2>/dev/null || echo "백업 파일이 없습니다."

echo ""
success "✅ 백업 프로세스가 완료되었습니다!"
echo ""
echo "백업 파일: $BACKUP_DIR/$BACKUP_FILE"
echo "복구 방법: DEPLOYMENT.md의 '롤백 및 트러블슈팅' 섹션 참조"
