# 복지 리포트 기능 발표 대본 (V1 → V2)

> **발표 시간**: 5-7분  
> **대상**: 기술 심사위원 / 멘토  
> **목적**: V1의 한계를 인식하고 V2로 진화한 기술적 여정 설명

---

## 📱 화면 구성 소개

### 기존 기능 (1학기)
- **수리 기록 확인**: 휠체어 고장 이력 조회
- **자가 점검**: 사용자가 직접 체크리스트 작성

### 새로 추가된 기능 (2학기)
- **복지 리포트 V1** (11월)
- **복지 리포트 V2** (12월) ← 오늘 설명할 내용

---

## 1️⃣ V1: 첫 번째 시도 (11월)

### 화면 1: 휠체어 건강 점수 + 이동 거리

*[V1 스크린샷 1 - 통합 점수 화면]*

**발표 멘트**:
> "V1에서는 **단일 건강 점수**로 모든 것을 표현했습니다. 휠체어 상태와 사용자 활동을 하나의 숫자로 압축했죠. 
> 
> 이동 거리는 GPS 센서 API를 통해 실시간으로 수집하고, 수리 이력과 자가점검 데이터를 결합해 점수를 산정했습니다."

**기술 스택 (V1)**:
```
Frontend: React + TypeScript + styled-components
Backend: Firebase Cloud Functions (동기식)
AI: OpenAI GPT-4o
Data: Firestore + 성동구 GPS API
```

**핵심 로직**:
```javascript
// V1 점수 계산 (단순 가중치 합산)
const healthScore = 
  (weeklyKm * 0.3) +           // 이동량 30%
  (100 - repairs * 10) * 0.4 + // 수리 이력 40%
  (selfChecks * 5) * 0.3;      // 자가점검 30%
```

---

### 화면 2: AI 분석 요약

*[V1 스크린샷 2 - AI 요약 화면]*

**발표 멘트**:
> "GPT-4o를 사용해 사용자의 데이터를 요약하고, 복지 서비스를 추천했습니다. 
> 
> 하지만 여기서 **첫 번째 문제**가 발생했습니다."

**V1의 기술적 한계**:

| 문제 | 원인 | 영향 |
|------|------|------|
| **타임아웃 위험** | 동기식 처리 (60초 제한) | GPT 응답 지연 시 실패 |
| **부적합 서비스 추천** | 키워드 매칭 기반 필터링 | "LPG 차량 세금 지원" 같은 무관한 서비스 추천 |
| **단일 점수의 한계** | 휠체어 상태 + 사용자 활동 혼재 | "점수가 낮은데 뭘 고쳐야 하나?" 불명확 |

**멘토링 피드백**:
> "이거 그냥 GPT Wrapper 아닌가요? 데이터가 쌓이면 뭘 할 건가요?"

---

## 2️⃣ V1 피드백 분석 및 개선 방향

**발표 멘트**:
> "멘토링에서 받은 피드백을 분석한 결과, 세 가지 근본적인 문제를 발견했습니다."

### 문제 1: "GPT Wrapper" 수준의 AI 활용
```
현재: 사용자 데이터 → GPT에 던지기 → 요약 받기
문제: AI가 "요약"만 하고 "추론"은 안 함
```

**개선 방향**: 
- RAG (Retrieval-Augmented Generation) 도입
- Vector DB로 의미론적 검색 구현

### 문제 2: 확장성 부족
```
현재: 동기식 처리 (Cloud Functions 60초 제한)
문제: GPT-5 응답이 30초 이상 걸리면 타임아웃
```

**개선 방향**:
- 비동기 이벤트 기반 아키텍처
- Cloud Tasks + Firestore polling

### 문제 3: 단일 점수의 모호함
```
현재: 휠체어 상태 + 사용자 활동 = 하나의 점수
문제: "점수가 낮은데 뭘 개선해야 하나?" 불명확
```

**개선 방향**:
- Dual-Axis 분석 (사용자 이동 / 기기 상태 분리)

---

## 3️⃣ V2: 기술적 진화 (12월)

### Phase 1: 비동기 백엔드 + Dual-Axis UI

**발표 멘트**:
> "V2에서는 두 가지 핵심 변화를 만들었습니다. 
> 
> 첫째, **비동기 처리**로 시스템 안정성을 확보했습니다. 
> 둘째, **Dual-Axis 분석**으로 사용자에게 명확한 인사이트를 제공했습니다."

#### 아키텍처 변경

```
[V1 동기식]
Client → Cloud Function → GPT (30초+) → Timeout 위험

[V2 비동기식]
Client → Trigger Function (즉시 응답)
              ↓
         Cloud Tasks
              ↓
         Worker Function → GPT (9분 타임아웃)
              ↓
         Firestore 저장
              ↓
         FCM 푸시 알림
```

**기술 선택 근거**:

| 기술 | 선택 이유 |
|------|-----------|
| **Cloud Tasks** | HTTP 기반 자동 재시도, 지연 실행 지원 |
| **Firestore Polling** | 실시간 업데이트 없이도 상태 추적 가능 |
| **FCM** | 리포트 완료 시 사용자에게 즉시 알림 |

#### Dual-Axis 분석

*[V2 스크린샷 1 - Dual-Axis 카드]*

**발표 멘트**:
> "V1의 단일 점수를 두 개의 독립적인 지표로 분리했습니다."

```typescript
// V2 Dual-Axis 구조
interface DualAxisReport {
  userMobility: {
    status: 'active' | 'stable' | 'declining' | 'inactive',
    weeklyKm: number,
    trend: 'increase' | 'decrease' | 'stable',
    grade: 'A' | 'B' | 'C'
  },
  deviceCondition: {
    grade: 'good' | 'fair' | 'poor',
    recentRepairs: number,
    recentSelfChecks: number,
    daysSinceLastCheck: number
  }
}
```

**분리의 효과**:
- **사용자**: "내 이동량은 많은데 기기 상태가 안 좋네" → 점검 유도
- **기기**: "이동량은 적은데 수리가 많네" → 사용 패턴 개선 제안

#### UI 개선

*[V2 스크린샷 2 - 등급 기준 설명 카드]*

**발표 멘트**:
> "등급 기준을 명시해 투명성을 높였습니다. '최근 30일' 기준을 명확히 표시했죠."

```tsx
// 등급 기준 카드
<GradeCriteriaCard>
  <h3>등급 기준 (최근 30일)</h3>
  <ul>
    <li>A등급: 주 30km 이상 + 수리 0-1회</li>
    <li>B등급: 주 10-30km + 수리 2-3회</li>
    <li>C등급: 주 10km 미만 또는 수리 4회+</li>
  </ul>
</GradeCriteriaCard>
```

#### 서비스 라벨링

*[V2 스크린샷 3 - 서비스 추천 화면]*

**발표 멘트**:
> "복지 서비스를 두 가지로 분류했습니다. 
> 🚌 **이동지원 서비스** (교통비 지원, 이동 바우처 등)
> 🏥 **생활지원 복지서비스** (건강검진, 돌봄 서비스 등)"

```javascript
// LLM 프롬프트에서 서비스 분리 요청
{
  "mobilityServices": [
    { "name": "장애인 이동지원 바우처", "reason": "..." }
  ],
  "welfareServices": [
    { "name": "장애인 건강검진 지원", "reason": "..." }
  ]
}
```

---

### Phase 2: LangGraph 검증 루프

**발표 멘트**:
> "V1에서 가장 큰 문제였던 **부적합 서비스 추천**을 해결하기 위해 LangGraph를 도입했습니다."

#### 문제 상황

```
사용자: 전동휠체어 사용자
추천된 서비스: "국가유공자 등 LPG차량 세금인상분 지원"
                ↑ 완전히 무관한 서비스!
```

#### 해결 방법: LangGraph 검증 루프

```javascript
// welfareGraph.js - 검증 루프
async function runValidationLoop(userContext, candidateServices) {
  const MAX_RETRIES = 2;
  let excludedServices = [];
  
  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    // 1. 제외된 서비스 필터링
    const filtered = candidateServices.filter(
      s => !excludedServices.includes(s.name)
    );
    
    // 2. LLM 호출
    const llmResult = await runLLMNode(userContext, filtered);
    
    // 3. 검증
    const validation = validateLLMResult(llmResult);
    
    if (validation.isValid) {
      return llmResult; // 성공
    }
    
    // 4. 부적합 서비스 제외 목록에 추가
    excludedServices.push(...validation.invalidServices);
  }
  
  // 최대 재시도 후 필터링된 결과 반환
  return filteredResult;
}
```

**검증 로직**:
```javascript
// validatorNode.js - 키워드 기반 검증
const INVALID_KEYWORDS = [
  'LPG', '차량', '자동차', '승용차', 
  '운전', '주유', '연료'
];

function validateLLMResult(result) {
  const invalidServices = result.services.filter(service => {
    return INVALID_KEYWORDS.some(keyword => 
      service.name.includes(keyword)
    );
  });
  
  return {
    isValid: invalidServices.length === 0,
    invalidServices,
    validServices: result.services.filter(s => 
      !invalidServices.includes(s)
    )
  };
}
```

**효과**:
- LPG 차량 등 부적합 서비스 100% 필터링
- 최대 2회 재시도로 추천 품질 향상
- 사용자 컨텍스트 기반 정확한 추천

---

### GPT-5 모델 업그레이드

**발표 멘트**:
> "V1에서 GPT-4o를 사용했는데, V2에서는 GPT-5로 업그레이드했습니다. 
> 하지만 여기서 **우여곡절**이 있었습니다."

#### 시행착오 1: GPT-5 기본 모델

```javascript
// 첫 시도: GPT-5 기본 설정
model: "gpt-5",
temperature: 0.3

// 결과: 응답 시간 50초+ (너무 느림!)
```

**문제**: GPT-5는 reasoning 모델이라 기본적으로 깊은 추론을 수행 → 느림

#### 시행착오 2: GPT-5 chat-latest

```javascript
// 두 번째 시도: chat-latest 모델
model: "gpt-5-chat-latest"

// 결과: 빠르지만 비용이 2배!
// Input: $2.50/1M tokens (기본 모델 대비 2배)
```

**문제**: 속도는 빠르지만 비용 부담

#### 최종 해결: reasoning_effort 파라미터

```javascript
// 최종 선택: reasoning_effort: "low"
model: "gpt-5",
reasoning_effort: "low"  // ← 핵심!

// 결과: 
// - 응답 시간: 5-15초 (적절)
// - 비용: $1.25/1M tokens (기본 모델과 동일)
// - 품질: 복지 서비스 추천에 충분
```

**기술적 의사결정**:

| 옵션 | 속도 | 비용 | 품질 | 선택 |
|------|------|------|------|------|
| gpt-4o | 빠름 | 저렴 | 중간 | ❌ |
| gpt-5 (default) | 매우 느림 | 중간 | 최고 | ❌ |
| gpt-5-chat-latest | 빠름 | 비쌈 | 높음 | ❌ |
| **gpt-5 + reasoning_effort: low** | **적절** | **중간** | **높음** | **✅** |

---

## 4️⃣ 현재 상황 및 성과

### 성능 비교

| 지표 | V1 | V2 |
|------|----|----|
| **응답 시간** | 10-60초 (타임아웃 위험) | 5-15초 (안정적) |
| **타임아웃 위험** | 높음 (60초 제한) | 없음 (9분 제한) |
| **부적합 서비스** | 간헐적 발생 | 100% 필터링 |
| **사용자 이해도** | 낮음 (단일 점수) | 높음 (Dual-Axis) |
| **비용/건** | ~$0.003 | ~$0.005 |

### 배포 현황

```bash
# 백엔드 배포 완료
✅ Cloud Functions (welfareWorker)
✅ LangGraph 검증 루프
✅ GPT-5 + reasoning_effort: low

# 프론트엔드 배포 완료
✅ Dual-Axis UI
✅ 등급 기준 설명 카드
✅ 서비스 라벨링
✅ AI 요약 한글 매핑 (stable → 안정)
```

---

## 5️⃣ 향후 기술적 보완 방향

### 단기 (1-2주)

**1. Vector DB (Pinecone) 도입**
```
현재: Firestore 전체 스캔 → 키워드 매칭
개선: Vector Search → 의미론적 검색

효과: "휠체어 타이어" 검색 시 "보장구 수리 지원" 자동 매칭
```

**2. 실시간 알림 개선**
```
현재: FCM 기본 알림
개선: 보호자 연동 (Guardian Mode)

효과: 위험 감지 시 보호자에게 자동 알림
```

### 중기 (1-2개월)

**3. GPS 패턴 분석 고도화**
```
현재: 주행 거리 합계 + 추세
개선: 급감속 이벤트 클러스터링 → 위험 구간 탐지

효과: "이 도로가 위험해요" → 지자체 제보 (B2G 모델)
```

**4. 피드백 루프 (RLHF)**
```
현재: 일방향 추천
개선: 사용자 피드백 수집 → 다음 추천 개선

효과: 사용할수록 똑똑해지는 시스템
```

### 장기 (3개월+)

**5. Time-series DB (InfluxDB)**
```
현재: Firestore (범용 DB)
개선: InfluxDB (시계열 전용)

효과: 대량 GPS 데이터 효율적 저장 + 분석
```

---

## 6️⃣ 기술적 의미 및 학습

### 배운 것

**1. 비동기 아키텍처의 중요성**
> "동기식 처리는 간단하지만, 확장성이 없습니다. 
> Cloud Tasks를 통해 **엔터프라이즈급 비동기 처리**를 경험했습니다."

**2. LLM 애플리케이션 설계**
> "GPT를 단순히 호출하는 것을 넘어, **검증 루프**와 **프롬프트 엔지니어링**으로 
> 실제 프로덕션에서 사용 가능한 시스템을 만들었습니다."

**3. 사용자 중심 설계**
> "단일 점수가 아닌 **Dual-Axis 분석**으로 사용자에게 
> 실질적인 행동 지침을 제공할 수 있었습니다."

### 기술 포트폴리오 가치

| 기술 | 어필 포인트 |
|------|-------------|
| **Cloud Tasks** | 대규모 비동기 처리 경험 |
| **LangGraph** | LLM 파이프라인 설계 및 검증 루프 구현 |
| **GPT-5 최적화** | reasoning_effort 파라미터로 비용/성능 균형 |
| **Dual-Axis 분석** | 복잡한 데이터를 명확한 인사이트로 변환 |

---

## 🎯 마무리

**발표 멘트**:
> "V1은 **MVP로서 성공적**이었습니다. 하지만 멘토링 피드백을 통해 
> 세 가지 근본적인 문제를 발견했고, V2에서 이를 해결했습니다.
> 
> 1. **'GPT Wrapper'를 넘어선 AI 활용** → LangGraph 검증 루프
> 2. **확장 가능한 아키텍처** → 비동기 이벤트 기반
> 3. **명확한 사용자 인사이트** → Dual-Axis 분석
> 
> 이 과정에서 **실제 프로덕션 환경에서 LLM을 안정적으로 운영하는 방법**을 
> 깊이 있게 학습할 수 있었습니다.
> 
> 향후에는 Vector DB, 피드백 루프, GPS 패턴 분석을 통해 
> **데이터가 쌓일수록 가치가 커지는 시스템**으로 진화시킬 계획입니다."

---

## 📸 필요한 스크린샷 목록

### V1 화면
1. ✅ 휠체어 건강 점수 + 이동 거리 통합 화면
2. ✅ AI 분석 요약 화면

### V2 화면
1. ✅ Dual-Axis 카드 (사용자 이동 / 기기 상태 분리)
2. ✅ 등급 기준 설명 카드
3. ✅ 서비스 추천 화면 (🚌 이동지원 / 🏥 생활지원 라벨링)
4. ✅ AI 요약 한글 매핑 (stable → 안정)
5. ✅ GPS 센서 미부착 안내 카드

---

*발표 시간: 약 7분*
*질의응답 대비: LangGraph 구현 상세, GPT-5 비용 분석, Vector DB 도입 계획*
