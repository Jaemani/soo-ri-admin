# 수리수리 V2 개발 로그

> **문서 목적**: V2 개발 과정의 모든 변경사항, 버그, 수정 내역을 기록  
> **시작일**: 2025년 12월 15일  
> **최종 업데이트**: 2025년 12월 15일

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [개발 타임라인](#2-개발-타임라인)
3. [Phase 1: Foundation 구현 로그](#3-phase-1-foundation-구현-로그)
4. [버그 및 수정 내역](#4-버그-및-수정-내역)
5. [배포 기록](#5-배포-기록)
6. [파일 변경 이력](#6-파일-변경-이력)

---

## 1. 프로젝트 개요

### 1.1 V2 목표
- **동기식 → 비동기식** 아키텍처 전환
- **Cloud Tasks** 기반 작업 큐 도입
- **FCM** 푸시 알림 연동
- **RAG** 기반 검색 (Phase 2 예정)
- **Guardian Mode** 보호자 알림 (Phase 3 예정)

### 1.2 기술 스택
| 영역 | 기술 |
|------|------|
| Backend | Firebase Cloud Functions (Node.js 20) |
| Database | Firebase Firestore |
| Queue | Google Cloud Tasks |
| AI | OpenAI GPT-5, Embedding API |
| Notification | Firebase Cloud Messaging (FCM) |
| Vector DB | Pinecone (Phase 2) |

---

## 2. 개발 타임라인

| 날짜 | 시간 | 작업 내용 | 상태 |
|------|------|-----------|------|
| 2025-12-15 | 00:30 | V1 피드백 문서 작성 | ✅ 완료 |
| 2025-12-15 | 00:45 | V2 로드맵 문서 작성 | ✅ 완료 |
| 2025-12-15 | 01:00 | V2 Master Plan 작성 | ✅ 완료 |
| 2025-12-15 | 01:08 | 기존 시스템 호환성 검토 | ✅ 완료 |
| 2025-12-15 | 01:22 | RAG/LangGraph 기술 분석 섹션 추가 | ✅ 완료 |
| 2025-12-15 | 01:28 | Pinecone/InfluxDB/Embedding 비용 분석 | ✅ 완료 |
| 2025-12-15 | 01:30 | Phase 1 구현 시작 | ✅ 완료 |
| 2025-12-15 | 01:35 | Trigger/Worker Function 구현 | ✅ 완료 |
| 2025-12-15 | 01:38 | Lazy Initialization 버그 수정 | ✅ 완료 |
| 2025-12-15 | 01:40 | Firebase Functions 배포 | ✅ 완료 |

---

## 3. Phase 1: Foundation 구현 로그

### 3.1 Cloud Tasks 패키지 추가

**파일**: `functions/package.json`

```diff
"dependencies": {
+   "@google-cloud/tasks": "^5.5.0",
    "axios": "^1.13.2",
    ...
}
```

**이유**: Cloud Tasks API를 사용하여 비동기 작업 큐 구현

---

### 3.2 Trigger Function 구현

**파일**: `functions/welfare/v2/triggerFunction.js` (신규)

**주요 기능**:
1. 요청 검증
2. 중복 요청 방지 (최근 5분 내 동일 사용자 요청 체크)
3. Cloud Tasks에 작업 등록
4. 즉시 202 Accepted 응답

**핵심 코드**:
```javascript
async function triggerWelfareReport(userId) {
  // 1. 중복 요청 확인
  const recentTask = await checkRecentTask(userId);
  if (recentTask) {
    return { error: 'DUPLICATE_REQUEST', ... };
  }

  // 2. Task 상태 문서 생성
  const taskId = `welfare-${userId}-${Date.now()}`;
  await taskRef.set({ taskId, userId, status: 'pending', ... });

  // 3. Cloud Tasks에 작업 등록
  await createCloudTask(taskId, userId);

  return { success: true, taskId, status: 'queued', ... };
}
```

---

### 3.3 Worker Function 구현

**파일**: `functions/welfare/v2/workerFunction.js` (신규)

**주요 기능**:
1. Cloud Tasks에서 HTTP POST로 호출됨
2. 기존 파이프라인 실행 (`runWelfarePipeline`)
3. 리포트 저장 + V2 메타데이터 추가
4. 상태 업데이트 (pending → processing → completed/failed)
5. FCM 알림 발송

**핵심 코드**:
```javascript
async function processWelfareReport(payload) {
  const { taskId, userId } = payload;
  
  // 1. 상태: processing
  await taskRef.update({ status: 'processing', ... });
  
  // 2. 파이프라인 실행
  const result = await runWelfarePipeline(userId);
  
  // 3. V2 메타데이터 추가
  await reportRef.update({ version: 'v2', generationMethod: 'async', ... });
  
  // 4. 상태: completed
  await taskRef.update({ status: 'completed', ... });
  
  // 5. FCM 알림
  await sendCompletionNotification(userId, taskId);
}
```

---

### 3.4 API 엔드포인트 추가

**파일**: `functions/api.js`

**추가된 엔드포인트**:

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/admin/welfare/generate/async` | 비동기 리포트 생성 요청 |
| GET | `/admin/welfare/status/:taskId` | Task 상태 조회 |
| GET | `/admin/welfare/status/user/:userId` | 사용자 최신 Task 조회 |

**기존 V1 API 유지**:
- `POST /admin/welfare/generate` - 동기식 (기존 그대로)

---

### 3.5 Worker Function 등록

**파일**: `functions/index.js`

```javascript
exports.welfareWorker = functions
  .region('asia-northeast3')
  .runWith({
    timeoutSeconds: 540,  // 9분 (GPT 응답 시간 고려)
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    // Cloud Tasks에서 호출
    const result = await processWelfareReport(payload);
    res.status(200).json(result);
  });
```

---

### 3.6 Firestore 인덱스 정의

**파일**: `firestore.indexes.json` (신규)

```json
{
  "indexes": [
    {
      "collectionGroup": "welfare_tasks",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    // ... 추가 인덱스
  ]
}
```

---

### 3.7 Cloud Tasks 설정 스크립트

**파일**: `scripts/setup-cloud-tasks.sh` (신규)

```bash
gcloud tasks queues create welfare-report-queue \
  --location=asia-northeast3 \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=100 \
  --max-attempts=3 \
  --min-backoff=10s \
  --max-backoff=300s
```

---

## 4. 버그 및 수정 내역

### 🐛 Bug #1: Firebase Admin 초기화 오류

**발생 시점**: 2025-12-15 01:35

**증상**:
```
Error: The default Firebase app does not exist. 
Make sure you call initializeApp() before using any of the Firebase services.
```

**원인**:
- `triggerFunction.js`, `workerFunction.js`, `pipeline.js`에서 모듈 로드 시점에 `admin.firestore()` 호출
- Firebase Admin이 `index.js`에서 초기화되기 전에 호출됨

**수정 전**:
```javascript
const admin = require('firebase-admin');
const db = admin.firestore();  // ❌ 모듈 로드 시점에 호출
```

**수정 후**:
```javascript
const admin = require('firebase-admin');

let db = null;

function getDb() {
  if (!db) {
    db = admin.firestore();  // ✅ 함수 호출 시점에 초기화
  }
  return db;
}
```

**영향 받은 파일**:
- `functions/welfare/v2/triggerFunction.js`
- `functions/welfare/v2/workerFunction.js`
- `functions/welfare/pipeline.js`

**해결 방법**: Lazy Initialization 패턴 적용

---

### 🐛 Bug #2: gcloud CLI 미설치

**발생 시점**: 2025-12-15 01:40

**증상**:
```
./scripts/setup-cloud-tasks.sh: line 24: gcloud: command not found
```

**원인**: 로컬 환경에 gcloud CLI가 설치되어 있지 않음

**해결 방법**: 
- GCP Console에서 직접 Cloud Tasks 큐 생성
- 또는 gcloud CLI 설치 후 스크립트 재실행

**참고**: Cloud Tasks 큐가 없어도 Functions는 배포됨. 실제 비동기 요청 시 큐 필요.

---

## 5. 배포 기록

### 배포 #1: 2025-12-15 01:40

**명령어**: `firebase deploy --only functions`

**결과**:
```
✔  functions[api(asia-northeast3)] Successful update operation.
✔  functions[welfareWorker(asia-northeast3)] Successful create operation.
✔  functions[sendSms(us-central1)] Successful update operation.
```

**배포된 Functions**:
| Function | Region | URL |
|----------|--------|-----|
| api | asia-northeast3 | https://asia-northeast3-soo-ri.cloudfunctions.net/api |
| welfareWorker | asia-northeast3 | https://asia-northeast3-soo-ri.cloudfunctions.net/welfareWorker |
| sendSms | us-central1 | (callable) |

**경고 사항**:
- `firebase-functions` 버전 업그레이드 권장 (4.9.0 → 5.1.0+)

---

## 6. 파일 변경 이력

### 신규 생성 파일

| 파일 | 설명 | 라인 수 |
|------|------|---------|
| `functions/welfare/v2/triggerFunction.js` | 비동기 트리거 | ~200 |
| `functions/welfare/v2/workerFunction.js` | 백그라운드 워커 | ~290 |
| `functions/welfare/v2/index.js` | V2 모듈 export | ~30 |
| `scripts/setup-cloud-tasks.sh` | Cloud Tasks 설정 | ~55 |
| `firestore.indexes.json` | Firestore 인덱스 | ~55 |
| `docs/V1_FEEDBACK_AND_IMPROVEMENT.md` | V1 피드백 문서 | ~250 |
| `docs/V2_IMPLEMENTATION_ROADMAP.md` | V2 로드맵 문서 | ~1500+ |
| `docs/DEVELOPMENT_LOG.md` | 개발 로그 (현재 문서) | - |

### 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `functions/package.json` | `@google-cloud/tasks` 패키지 추가 |
| `functions/api.js` | V2 import 추가, V2 API 엔드포인트 추가 (~80줄) |
| `functions/index.js` | `welfareWorker` Function 추가 (~55줄) |
| `functions/welfare/pipeline.js` | Lazy initialization 적용 |

---

---

## 7. Phase 1.7: 프론트엔드 비동기 UX 업데이트

### 7.1 ViewModel 업데이트

**파일**: `soo-ri/src/presentation/pages/WelfareReportPage/WelfareReportPageViewModel.ts`

**추가된 기능**:
1. V2 비동기 상태 관리 (`asyncStatus`, `statusMessage`, `currentTaskId`)
2. 폴링 기반 상태 조회 (`pollTaskStatus`, `startPolling`)
3. V2 비동기 리포트 생성 함수 (`generateReportAsync`)
4. V1 동기식 함수 유지 (`generateTestReport` - 폴백용)

**핵심 코드**:
```typescript
// V2 비동기 상태 타입
type AsyncStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

// 상태 폴링 (2초 간격)
const pollTaskStatus = useCallback(async (taskId: string) => {
  const response = await fetch(`${API_URL}/admin/welfare/status/${taskId}`)
  const status = await response.json()
  
  switch (status.status) {
    case 'completed':
      await refetch()  // 리포트 새로고침
      setGenerating(false)
      break
    case 'failed':
      setStatusMessage(`❌ 실패: ${status.error}`)
      break
  }
}, [])

// V2 비동기 리포트 생성
const generateReportAsync = async () => {
  const response = await fetch(`${API_URL}/admin/welfare/generate/async`, {
    method: 'POST',
    body: JSON.stringify({ userId: user.uid }),
  })
  
  if (response.status === 202) {
    const { taskId } = await response.json()
    startPolling(taskId)  // 폴링 시작
  }
}
```

---

### 7.2 View 컴포넌트 업데이트

**파일**: `soo-ri/src/presentation/pages/WelfareReportPage/WelfareReportPageViewMobile.tsx`

**추가된 UI 요소**:
- `AsyncStatusCard`: 비동기 상태 표시 카드
- `AsyncStatusIcon`: 상태별 이모지 아이콘
- `AsyncStatusText`: 상태 메시지
- `AsyncSpinner`: 로딩 스피너 애니메이션

**UI 흐름**:
```
[버튼 클릭] → [📤 요청 전송 중...] → [⏳ 대기 중...] → [🤖 AI 분석 중...] → [✅ 완료!]
```

---

### 7.3 버그 수정

**🐛 Bug #3: TypeScript NodeJS.Timeout 오류**

**발생 시점**: 2025-12-15 01:50

**증상**:
```
error TS2503: Cannot find namespace 'NodeJS'.
```

**원인**: 브라우저 환경에서 `NodeJS.Timeout` 타입 사용 불가

**수정 전**:
```typescript
const pollingRef = useRef<NodeJS.Timeout | null>(null)
```

**수정 후**:
```typescript
const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
```

---

**🐛 Bug #4: ESLint 규칙 위반**

**발생 시점**: 2025-12-15 02:00

**증상**:
```
error  Prefer using an optional chain expression instead
error  Prefer using nullish coalescing operator (`??`) instead of a logical or (`||`)
```

**수정 내용**:
```typescript
// 수정 전
if (envUrl && envUrl.includes('cloudfunctions.net'))
status.error || '알 수 없는 오류'
result.estimatedTime || '30초~1분'

// 수정 후
if (envUrl?.includes('cloudfunctions.net'))
status.error ?? '알 수 없는 오류'
result.estimatedTime ?? '30초~1분'
```

---

**🐛 Bug #5: 템플릿 리터럴 괄호 오류**

**발생 시점**: 2025-12-15 02:00

**증상**: 중복된 닫는 괄호로 인한 구문 오류

**수정 전**:
```typescript
setStatusMessage(`⏳ 요청 접수됨 (예상 시간: ${result.estimatedTime ?? '30초~1분'})`)`)
```

**수정 후**:
```typescript
setStatusMessage(`⏳ 요청 접수됨 (예상 시간: ${result.estimatedTime ?? '30초~1분'})`)
```

---

---

## 8. Firestore 인덱스 생성

**발생 시점**: 2025-12-15 02:07

**증상**:
```
500 Internal Server Error
"9 FAILED_PRECONDITION: The query requires an index"
```

**원인**: `welfare_tasks` 컬렉션에 복합 인덱스 필요

**해결**: Firebase Console에서 인덱스 생성
- Collection: `welfare_tasks`
- Fields: `status`, `userId`, `createdAt`, `__name__`
- Query scope: Collection

---

## 9. V2 E2E 테스트 성공

**시점**: 2025-12-15 02:24

**테스트 결과**:
```
🚀 [V2] Async report generation for user: HpErhmIUaoc2q2v9yxkXjji375y2
📡 Response status: 202
✅ Task created: welfare-HpErhmIUaoc2q2v9yxkXjji375y2-1765732137303
📊 Task status: queued → processing → completed
✅ Report data retrieved
```

**성능 측정**:
- 요청 → 완료: ~6초
- 상태 전환: queued(2초) → processing(4초) → completed

---

## 10. Dual-Axis Report System 구현

### 10.1 V1 문제점 분석

**핵심 문제**: 사용자 활동성과 기기 건강도를 단일 점수로 합산
- 높은 주행거리: **사용자에게 좋음** (활동적) but **기기에게 나쁨** (마모)
- 결과: 단일 점수가 사용자를 혼란스럽게 함

### 10.2 V2 해결책: Dual-Axis 분리

**1. User Mobility Index (사람의 활동성)**
- 상태: `active` | `stable` | `declining` | `inactive`
- 색상: 🟢 Green, 🔵 Blue, 🟡 Yellow, 🔴 Red
- 지표: 주간 이동거리, 추세, 활동 일수

**2. Device Condition Index (기기의 건강도)**
- 등급: `A` (양호) | `B` (점검 권장) | `C` (주의 필요)
- 지표: 수리 횟수, 자가점검 횟수, 사용 강도

### 10.3 신규 생성 파일

| 파일 | 역할 |
|------|------|
| `domain/models/dual_axis_report_model.ts` | Dual-Axis 타입 정의 |
| `domain/logic/analyzeDualMetrics.ts` | 분석 로직 함수 |
| `components/DualAxisReport/StatusCard.tsx` | 상태 카드 컴포넌트 |
| `components/DualAxisReport/EvidenceList.tsx` | 근거 목록 컴포넌트 |
| `components/DualAxisReport/ActionableItems.tsx` | 추천 서비스 컴포넌트 |
| `WelfareReportPageViewMobileV2.tsx` | V2 UI 통합 View |

### 10.4 UI 구조

```
┌─────────────────────────────────────────┐
│ Section A: Dual Status Cards            │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ 나의 활동   │ │ 휠체어 상태 │        │
│ │ 🔵 안정    │ │ ✅ 양호 A  │        │
│ │ 18km 이동  │ │ 사용량 적음 │        │
│ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────┤
│ Section B: Contextual Evidence          │
│ 📊 분석 근거                            │
│ - 활동 분석: 이번 주 18km 이동          │
│ - 기기 상태: 최근 자가점검 기록 없음    │
│ 💡 정기 자가점검을 권장합니다           │
├─────────────────────────────────────────┤
│ Section C: Decoupled Recommendations    │
│ 🚗 이동 지원 서비스 (3개)               │
│ 🔧 기기 관리 서비스 (0개)               │
└─────────────────────────────────────────┘
```

### 10.5 버그 수정

**🐛 Bug #6: ESLint 에러 (analyzeDualMetrics.ts)**

- `@typescript-eslint/no-unnecessary-condition`: 불필요한 조건문 제거
- `@typescript-eslint/restrict-template-expressions`: 템플릿 리터럴에 `String()` 래핑

---

## 📝 다음 작업 예정

### Phase 1 완료 ✅
- [x] Cloud Tasks 큐 생성 (GCP Console)
- [x] 프론트엔드 비동기 UX 업데이트
- [x] E2E 테스트
- [x] Dual-Axis Report System 구현

### Phase 2 예정
- [ ] Pinecone 설정 및 임베딩 파이프라인
- [ ] RAG 검색 구현
- [ ] 피드백 루프 구현

### Phase 3 예정
- [ ] GPS 패턴 분석
- [ ] 위험 감지 시스템
- [ ] Guardian Mode 완성

---

*이 문서는 V2 개발 과정에서 지속적으로 업데이트됩니다.*
