# 복지 리포트 테스트 스크립트 가이드

## 📋 스크립트 목록

### 1. `test-gps-api.js`
**목적**: 성동구 GPS API 연동 테스트

**사용법**:
```bash
node scripts/test-gps-api.js
```

**기능**:
- GPS API 호출 테스트
- 오늘 날짜 데이터 조회
- 특정 센서 ID로 데이터 조회
- 최근 7일 데이터 집계 및 추세 분석

---

### 2. `generate-mock-reports.js`
**목적**: Mock 복지 리포트 데이터 생성

**사용법**:
```bash
node scripts/generate-mock-reports.js
```

**출력**:
- 5명의 Mock 사용자에 대한 복지 리포트 데이터
- Firestore에 수동으로 입력할 수 있는 JSON 형식

**다음 단계**:
1. 출력된 JSON 데이터 복사
2. Firebase Console → Firestore Database
3. `user_welfare_reports` 컬렉션 생성
4. 각 사용자별로 문서 생성 (Document ID = userId)
5. JSON 데이터 붙여넣기

---

### 3. `create-sample-report.js`
**목적**: 특정 사용자에 대한 샘플 리포트 생성

**사용법**:
```bash
node scripts/create-sample-report.js <userId>
```

**요구사항**:
- Firebase Admin SDK 인증 필요
- Service account key 또는 Firebase CLI 로그인

---

### 4. `setup-test-users.js`
**목적**: 실제 Firestore 사용자에게 센서 ID 할당 및 리포트 생성

**사용법**:
```bash
node scripts/setup-test-users.js
```

**기능**:
1. Firestore에서 처음 5명의 사용자 조회
2. 각 사용자에게 센서 ID 할당 (`sensorId` 필드 추가)
3. 각 사용자에 대한 샘플 복지 리포트 생성

**요구사항**:
- Firebase Admin SDK 인증 필요

---

## 🔑 실제 사용자 UID 확인 방법

### 방법 1: Firebase Console
1. Firebase Console → Firestore Database
2. `users` 컬렉션 열기
3. 문서 ID가 사용자 UID

### 방법 2: 앱에서 확인
1. 앱 실행 및 로그인
2. 복지 리포트 페이지 이동
3. "리포트 생성하기" 버튼 클릭
4. 브라우저 콘솔에서 `🔑 Current User ID:` 확인

---

## 🧪 테스트 플로우

### 빠른 UI 테스트 (Mock 데이터)
```bash
# 1. Mock 데이터 생성
node scripts/generate-mock-reports.js

# 2. 출력된 JSON을 Firebase Console에서 수동으로 입력
# 3. 앱에서 복지 리포트 페이지 확인
```

### 실제 API 테스트
```bash
# 1. GPS API 작동 확인
node scripts/test-gps-api.js

# 2. Functions 배포 (GPS API 연동 코드 포함)
firebase deploy --only functions

# 3. 앱에서 "리포트 생성하기" 버튼 클릭
# 4. 브라우저 콘솔에서 로그 확인
```

---

## 📊 리포트 데이터 구조

```typescript
{
  userId: string;           // 사용자 UID
  summary: string;          // 이동 패턴 요약
  risk: string;             // 주의 사항
  services: [               // 추천 서비스 (최대 3개)
    {
      name: string;         // 서비스명
      reason: string;       // 추천 이유
    }
  ];
  metadata: {
    weeklyKm: number;       // 주간 이동거리 (km)
    trend: string;          // 추세 (increase/decrease/stable)
    recentRepairs: number;  // 최근 수리 횟수
    recentSelfChecks: number; // 최근 자가점검 횟수
  };
  isFallback: boolean;      // Fallback 여부
  createdAt: Timestamp;     // 생성 시각
}
```

---

## ⚠️ 주의사항

1. **센서 ID 매핑**: 사용자와 센서 ID를 매핑하려면 `users` 컬렉션에 `sensorId` 필드 추가 필요
2. **GPS 데이터 기간**: 2025년 8월 7일부터 데이터 적재됨
3. **API 응답 시간**: GPS API는 10분 텀으로 집계되므로 실시간 데이터가 아님
4. **Firebase 인증**: Admin SDK 사용 시 인증 필요

---

## 🔗 관련 문서

- API 명세: `/functions/data/성동구API명세서.csv`
- 사용자 센서 정보: `/functions/data/사용자센서정보.csv`
- 복지 서비스 데이터: `/functions/data/한국사회보장정보원_복지서비스정보_20250722.csv`
- 설계 문서: `NEW_FEATURE_PLAN.md`
- 개발 로그: `DEVELOPMENT_LOG.md`
