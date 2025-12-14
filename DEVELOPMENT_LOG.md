# 🛠️ Development Log: Welfare Intelligence Pipeline (WIP)

## 프로젝트 개요
- **목표**: LLM을 활용한 안정적인 배치 기반 맞춤형 복지 리포트 시스템 구축
- **핵심 전략**: LLM을 '지능'이 아닌 파이프라인의 '노드'로 설계하여 신뢰성 확보
- **기간**: 2025-12-06 ~ (진행 중)

## 📅 Timeline & Issues

### [2025-12-06] 프로젝트 착수 및 설계
- **Plan**: `NEW_FEATURE_PLAN.md`에 전체 아키텍처 및 데이터 모델 설계 완료.
- **Decision**: 
  - 실시간 처리가 아닌 **배치(Batch)** 처리 방식으로 결정 (안정성 및 비용 고려).
  - 폴더 구조를 모듈화(`functions/welfare/*`)하여 추후 **LangGraph** 등 에이전트 프레임워크로의 확장성 확보.
- **Input**:
  - `OPENAI_API_KEY` 설정 완료.
  - `한국사회보장정보원_복지서비스정보_20250722.csv` 데이터 확보.

### [2025-12-06] Welfare Intelligence Pipeline 구현 완료
- **Task**: CSV Loader, Normalizer, User Context, Candidate Filter, LLM Node, Pipeline 구현.
- **Issues Resolved**:
  - **OpenAI Lazy Initialization**: 배포 시 `require` 타임에 환경 변수가 없어 에러 발생. `getOpenAI()` 함수로 지연 초기화 적용.
  - **CSV 인코딩**: UTF-8로 정상 처리됨.
  - **Firestore Timestamp**: 이전 세션 경험을 바탕으로 모든 날짜 필드를 ISO String으로 변환하여 처리.
- **Deployment**: Firebase Cloud Functions 배포 성공 (`POST /admin/welfare/generate` 엔드포인트 추가).

### [2025-12-06] soo-ri 앱 UI 구현 완료
- **Task**: 복지 리포트 페이지 및 FAB 메뉴 통합.
- **구현 내용**:
  - `WelfareReportModel`, `WelfareReportRepository`, `useWelfareReport` Hook 생성.
  - `WelfareReportPage` 생성 (ViewModel + View).
  - `RepairsPage` FAB 메뉴에 "맞춤형 복지 리포트" 항목 추가.
  - 라우팅 설정 완료 (`/welfare-report`).
- **UI 디자인**: 
  - 이동 패턴 분석 (Summary Card)
  - 주의 사항 (Risk Card - 빨간색 강조)
  - 추천 복지 서비스 목록 (Service Cards)
  - Fallback 알림 및 메타 정보 표시
- **Issues Resolved**:
  - 테마에 없는 색상/타이포그래피 사용 → 기존 테마 값으로 교체 (`surface` → `background`, `titleMedium` → `subtitleMedium` 등).
  - **Firestore Permission Error**: `user_welfare_reports` 컬렉션에 대한 읽기 권한 없음 → `firestore.rules` 생성 및 배포하여 해결.
- **UX 개선**:
  - Empty State에 "리포트 생성하기" 버튼 추가 → 사용자가 직접 리포트를 생성할 수 있도록 개선.
  - 백엔드 API (`/admin/welfare/generate`) 호출하여 실시간 리포트 생성 가능.

### [2025-12-06] GPS API 연동 완료
- **Task**: 성동구 주행 데이터 API 연동
- **구현 내용**:
  - `gpsDataFetcher.js` 노드 생성 - 실제 GPS API 호출
  - `userContext.js` 수정 - GPS 데이터를 실제로 사용하도록 변경
  - `axios` 의존성 추가
  - GPT 모델 업데이트: `gpt-4o` → `gpt-4o-2024-11-20` (최신 모델)
- **API 정보**:
  - Endpoint: `https://test-web2.star-pickers.com/v2/vehicle/mileage`
  - 데이터: 2025년 8월 7일부터 적재
  - 집계: 10분 텀으로 처리
- **문서화**:
  - `NEW_FEATURE_PLAN.md`에 GPS API 섹션 추가
  - API 명세서 및 사용자 센서 정보 CSV 파일 추가
- **주의사항**:
  - 사용자와 센서 ID 매핑 필요 (`users` 컬렉션에 `sensorId` 필드 추가 필요)
  - 센서 ID가 없는 경우 Fallback 데이터 사용

### [2025-12-07] 복지 리포트 기능 완료 🎉
- ✅ AI 기반 맞춤형 복지 추천 시스템 구축
- ✅ GPS 주행 데이터 실시간 연동
- ✅ 휠체어 건강 점수 알고리즘 (0-100점)
- ✅ 현대적 UI/UX 완전 재설계
- ✅ Functions 배포 및 테스트 완료

### [2025-12-07] UI/UX 대폭 개선
**Before**: 단순 텍스트 나열, 칙칙한 디자인  
**After**: 
- ✨ AI 배지 및 그라데이션
- 🎯 건강 점수 원형 차트 (색상 코딩)
- ⚠️ 주의 알림 카드
- 📊 4개 통계 카드 그리드
- 🤖 AI 분석 섹션
- 🎯 번호 배지 서비스 카드

### [2025-12-07] 문제 해결
1. **Firestore 권한 에러** → Security Rules 설정
2. **복합 인덱스 에러** → 단일 쿼리 + 클라이언트 필터링
3. **사용자 데이터 없음** → Fallback 데이터 처리
4. **칙칙한 UI** → 완전 재설계 (그라데이션, 아이콘, 색상 코딩)

### [2025-12-07] 문서화
- `WELFARE_REPORT_IMPLEMENTATION.md` 작성 (완전한 구현 보고서)
- 모든 문제 해결 과정 및 기술 스택 문서화
- 향후 개선 사항 로드맵 작성

### [2025-12-07] GPS API 연동 완료
- 성동구 주행 데이터 API 연동
- `gpsDataFetcher.js` 노드 생성
- `userContext.js`에 GPS 데이터 통합
- 실제 주행거리 및 추세 분석 로직 구현
- 센서 ID 매핑 구조 설계

### [2025-12-07] LLM 모델 업그레이드
- GPT-4o-2024-11-20 (최신 모델) 적용
- JSON 모드 응답 안정성 향상

### [2025-12-07] 테스트 스크립트 작성
- `test-gps-api.js`: GPS API 연동 테스트
- `setup-test-users.js`: 사용자 센서 ID 매핑 및 리포트 생성
- `generate-mock-reports.js`: Mock 데이터 생성

### [2025-12-07] 문서화
- `NEW_FEATURE_PLAN.md` 업데이트 (GPS API 섹션 추가)
- `scripts/README.md` 작성 (테스트 가이드)
