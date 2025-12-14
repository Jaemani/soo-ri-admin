# 수리수리 복지 리포트 V2 - 구현 기록

> **최종 업데이트**: 2025년 12월 15일  
> **Phase 1 완료**

---

## 🎯 프로젝트 목적

### 왜 V2인가?

**V1의 한계:**
- 동기식 처리로 인한 타임아웃 (Cloud Functions 60초 제한)
- 단순 키워드 매칭 기반 서비스 추천
- 전동보장구 사용자 컨텍스트 미반영 (LPG차량 등 부적합 서비스 추천)

**V2의 목표:**
- 비동기 처리로 안정적인 LLM 호출
- GPT-5 기반 맥락 인식 서비스 추천
- Dual-Axis 분석 (사용자 이동 + 기기 상태 분리)

---

## ✅ Phase 1 완료 (2025.12.15)

### 백엔드 변경사항

| 항목 | 변경 내용 |
|------|----------|
| **비동기 처리** | Cloud Tasks + Firestore polling 방식 |
| **LLM 모델** | `gpt-5` + `reasoning_effort: "low"` |
| **서비스 분리** | `mobilityServices` 3개 + `welfareServices` 3개 |
| **컨텍스트** | 전동보장구 사용자 명시 (LPG차량 등 제외) |

### 프론트엔드 변경사항

| 항목 | 변경 내용 |
|------|----------|
| **Dual-Axis UI** | 사용자 이동 / 기기 상태 분리 표시 |
| **등급 기준** | "최근 30일" 기준 명시 (A/B/C) |
| **서비스 라벨링** | 🚌 이동지원 / 🏥 생활지원 복지서비스 |
| **GPS 안내** | 센서 미부착 시 안내 카드 표시 |

### 주요 파일

```
soo-ri-admin/functions/
├── welfare/
│   ├── llmNode.js          # GPT-5 프롬프트 + reasoning_effort
│   └── userContext.js      # 사용자 컨텍스트 수집
└── index.js                # welfareWorker Cloud Function

soo-ri/src/
├── domain/logic/
│   └── analyzeDualMetrics.ts    # Dual-Axis 분석 로직
└── presentation/pages/WelfareReportPage/
    ├── WelfareReportPageViewMobileV2.tsx  # 새 UI
    └── WelfareReportPageViewModel.ts      # 비동기 상태 관리
```

---

## 📊 성능 비교

| 지표 | V1 | V2 (Phase 1) |
|------|-----|--------------|
| 응답 시간 | 10-60초 (타임아웃 위험) | 5-15초 (안정적) |
| 서비스 추천 | 키워드 매칭 | GPT-5 맥락 인식 |
| 비용/건 | ~$0.003 (gpt-4o-mini) | ~$0.005 (gpt-5 low) |

---

## 🚀 확장 계획

### Phase 2: LangGraph 검증 루프 (선택)

**목적:** 부적합 서비스 자동 필터링

```
[Retrieval] → [LLM] → [Validator] → (부적합) → [재요청]
                          ↓
                      (적합) → [Response]
```

**예상 효과:**
- LPG차량 등 부적합 서비스 100% 필터링
- 추천 품질 향상

### Phase 3: 고급 기능 (선택)

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **Vector DB** | Pinecone 기반 시맨틱 검색 | 중 |
| **실시간 센서** | InfluxDB 연동 | 낮음 |
| **FCM 푸시** | 리포트 완료 알림 | 낮음 |
| **Guardian Mode** | 보호자 알림 | 낮음 |

---

## 💡 기술적 의사결정 기록

### GPT-5 모델 선택

| 옵션 | 속도 | 비용 | 선택 |
|------|------|------|------|
| gpt-5 (default) | 50초+ | $1.25/$5 | ❌ |
| gpt-5 + reasoning_effort: low | 5-15초 | $1.25/$5 | ✅ |
| gpt-5-chat-latest | 3-5초 | $2.50/$10 | ❌ (비용 2배) |
| gpt-4o-mini | 2-3초 | $0.15/$0.60 | 대안 |

**결정:** `gpt-5` + `reasoning_effort: "low"` 
- 속도와 비용의 균형
- 복지 서비스 추천에 충분한 추론 능력

### 서비스 분류 방식

| 옵션 | 장점 | 단점 | 선택 |
|------|------|------|------|
| 프론트엔드 키워드 매칭 | 빠름 | 부정확 | ❌ |
| 백엔드 LLM 분류 | 정확 | 비용 | ✅ |

**결정:** 백엔드에서 `mobilityServices` / `welfareServices` 분리 반환

---

## 📝 알려진 제한사항

1. **LangGraph 미구현**: 부적합 서비스가 간헐적으로 추천될 수 있음 (프롬프트 레벨 필터링만)
2. **Vector DB 미사용**: 서비스 검색은 여전히 Firestore 기반
3. **프론트엔드 미배포**: 로컬 개발 서버에서만 테스트됨

---

## 🔗 관련 문서

- [V2 구현 로드맵](./V2_IMPLEMENTATION_ROADMAP.md)
- [기술 리포트](./WELFARE_REPORT_TECHNICAL_REPORT.md)
