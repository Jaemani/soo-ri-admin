#!/bin/bash

# ============================================
# Cloud Tasks 큐 설정 스크립트
# ============================================
# 
# 사용법:
#   chmod +x scripts/setup-cloud-tasks.sh
#   ./scripts/setup-cloud-tasks.sh
#
# 사전 요구사항:
#   1. gcloud CLI 설치
#   2. gcloud auth login
#   3. gcloud config set project soo-ri

PROJECT_ID="soo-ri"
LOCATION="asia-northeast3"
QUEUE_NAME="welfare-report-queue"

echo "🚀 Cloud Tasks 큐 설정 시작..."

# 1. Cloud Tasks API 활성화
echo "📦 Cloud Tasks API 활성화 중..."
gcloud services enable cloudtasks.googleapis.com --project=$PROJECT_ID

# 2. 큐 생성
echo "📬 큐 생성 중: $QUEUE_NAME"
gcloud tasks queues create $QUEUE_NAME \
  --location=$LOCATION \
  --project=$PROJECT_ID \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=100 \
  --max-attempts=3 \
  --min-backoff=10s \
  --max-backoff=300s \
  --max-doublings=4

# 3. 큐 설정 확인
echo "✅ 큐 설정 확인:"
gcloud tasks queues describe $QUEUE_NAME \
  --location=$LOCATION \
  --project=$PROJECT_ID

echo ""
echo "============================================"
echo "✅ Cloud Tasks 설정 완료!"
echo "============================================"
echo ""
echo "큐 이름: $QUEUE_NAME"
echo "위치: $LOCATION"
echo "프로젝트: $PROJECT_ID"
echo ""
echo "다음 단계:"
echo "  1. Firebase Functions 배포: firebase deploy --only functions"
echo "  2. 환경 변수 설정 (선택):"
echo "     firebase functions:config:set cloudtasks.queue=$QUEUE_NAME"
echo ""
