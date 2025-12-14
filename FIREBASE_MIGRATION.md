# 🔥 Firebase Migration 가이드

## 개요

수리수리 프로젝트는 기존 MongoDB + Next.js 백엔드에서 **Firebase Firestore + Cloud Functions**로 마이그레이션되었습니다.

### 마이그레이션 날짜
- 2024년 12월 (진행 중)

### 마이그레이션 범위
- ✅ **데이터베이스**: MongoDB → Firebase Firestore
- ✅ **백엔드 API**: Next.js API Routes → Firebase Cloud Functions
- ✅ **인증**: Firebase Authentication (Phone Number 기반)
- ✅ **호스팅**: Firebase Hosting
- ✅ **SMS 전송**: Firebase Cloud Functions (Solapi 연동)

---

## 🏗 아키텍처 구조

### 기존 아키텍처 (power_assist_device_helper_backend)
```
Frontend (Flutter/React) 
    ↓
Next.js API Routes (app/api/*)
    ↓
MongoDB (Mongoose)
    ↓
Firebase Auth (인증만)
```

### 새로운 아키텍처 (soo-ri / soo-ri-admin)
```
Frontend (React/Flutter)
    ↓
Firebase Hosting
    ↓ (rewrite /api → Cloud Functions)
Firebase Cloud Functions (functions/api.js)
    ↓
Firebase Firestore
    ↓
Firebase Auth (Phone Number)
```

---

## 📦 Firebase 프로젝트 정보

### 프로젝트 ID
- **soo-ri**

### Firebase Console
- https://console.firebase.google.com/project/soo-ri

### 리전
- **asia-northeast3** (서울)

### Firebase 설정
```javascript
{
  apiKey: "AIzaSyDg3qTE3ctQpoC9vwFvBvkLXXxMZjgaBfg",
  authDomain: "soo-ri.firebaseapp.com",
  projectId: "soo-ri",
  storageBucket: "soo-ri.firebasestorage.app",
  messagingSenderId: "857380792687",
  appId: "1:857380792687:web:0350e0210062460440a09a",
  measurementId: "G-N8L0E0CY99"
}
```

---

## 🔌 API 엔드포인트 변경

### 기존 (MongoDB 백엔드)
```
https://your-server.com/api/users
https://your-server.com/api/repairs
https://your-server.com/api/vehicles
```

### 새로운 (Firebase Cloud Functions)
```
https://soo-ri.web.app/api/users
https://soo-ri.web.app/api/repairs
https://soo-ri.web.app/api/vehicles
```

또는 로컬 개발 시:
```
http://localhost:5000/soo-ri/asia-northeast3/api/users
```

### Firebase Hosting Rewrite 설정
`firebase.json`에서 `/api` 경로를 Cloud Functions로 자동 라우팅:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api{,/**}",
        "function": {
          "functionId": "api",
          "region": "asia-northeast3"
        }
      }
    ]
  }
}
```

---

## 🗄 데이터베이스 스키마 변경

### MongoDB → Firestore 매핑

| MongoDB Collection | Firestore Collection | 변경사항 |
|-------------------|---------------------|---------|
| `users` | `users` | ObjectId → Document ID |
| `vehicles` | `vehicles` | ObjectId → Document ID |
| `repairs` | `repairs` | ObjectId → Document ID |
| `repairstations` | `repairStations` | ObjectId → Document ID |
| `guardians` | `guardians` | ObjectId → Document ID |
| `selfChecks` | `selfChecks` | 새로 추가 |

### Firestore 데이터 구조 예시

#### Users Collection
```javascript
{
  firebaseUid: "abc123...",
  name: "홍길동",
  phoneNumber: "+821012345678",
  role: "user", // 'user' | 'admin' | 'repairer' | 'guardian'
  recipientType: "disabled", // 'general' | 'disabled' | 'lowIncome'
  guardianIds: ["guardian_doc_id"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Vehicles Collection
```javascript
{
  vehicleId: "uuid-v4",
  userId: "user_doc_id",
  model: "전동휠체어 3000",
  purchasedAt: Timestamp,
  registeredAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Repairs Collection
```javascript
{
  vehicleId: "vehicle_doc_id",
  repairedAt: Timestamp,
  billingPrice: 50000,
  isAccident: false,
  repairStationCode: "ST01",
  repairStationLabel: "강남수리센터",
  repairer: "김수리",
  repairCategories: ["타이어", "배터리"],
  batteryVoltage: 36.5,
  etcRepairParts: "배터리 교체",
  memo: "정기 점검",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔐 인증 시스템

### Firebase Authentication
- **방식**: Phone Number Authentication (SMS 인증)
- **Provider**: Firebase Auth + Solapi (SMS 발송)

### 인증 흐름
1. 사용자가 전화번호 입력
2. Firebase Auth가 reCAPTCHA 검증
3. Cloud Function `sendSms`가 Solapi를 통해 인증번호 발송
4. 사용자가 인증번호 입력
5. Firebase Auth가 토큰 발급
6. 이후 모든 API 요청에 토큰 포함

### 환경 변수 설정 (필수)
```bash
# Firebase Functions 환경 변수 설정
firebase functions:config:set solapi.key="YOUR_SOLAPI_KEY"
firebase functions:config:set solapi.secret="YOUR_SOLAPI_SECRET"

# 또는 .env 파일 사용 (로컬 개발)
SOLAPI_KEY=your_key
SOLAPI_SECRET=your_secret
SENDER_PHONE=01058922434
```

---

## 📡 Cloud Functions 구조

### functions/index.js
- `sendSms`: SMS 전송 Callable Function
- `api`: Express 기반 HTTP API (functions/api.js에서 import)

### functions/api.js
주요 엔드포인트:

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | Health check |
| POST | `/admin/login` | 관리자 로그인 (임시) |
| GET | `/users` | 사용자 목록 조회 |
| GET | `/users/:id` | 사용자 상세 조회 |
| GET | `/repairs` | 수리 이력 조회 |
| GET | `/admin/repairs` | 관리자용 수리 이력 |
| POST | `/vehicles/:vehicleId/repairs` | 수리 이력 등록 |
| GET | `/vehicles/:vehicleId` | 차량 정보 조회 |
| GET | `/selfChecks` | 자가진단 조회 |
| GET | `/admin/selfChecks` | 관리자용 자가진단 |
| GET | `/repairStations` | 수리센터 목록 |
| PUT | `/repairStations` | 수리센터 정보 수정 |

---

## 🔧 프론트엔드 연동 가이드

### 1. soo-ri (사용자 앱)

#### 환경 변수 설정 (`.env`)
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDg3qTE3ctQpoC9vwFvBvkLXXxMZjgaBfg
VITE_FIREBASE_AUTH_DOMAIN=soo-ri.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=soo-ri
VITE_FIREBASE_STORAGE_BUCKET=soo-ri.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=857380792687
VITE_FIREBASE_APP_ID=1:857380792687:web:0350e0210062460440a09a
VITE_FIREBASE_MEASUREMENT_ID=G-N8L0E0CY99

# Backend API Configuration
VITE_SOORI_BASE_URL=https://soo-ri.web.app/api
# 로컬 개발 시:
# VITE_SOORI_BASE_URL=http://localhost:5000/soo-ri/asia-northeast3/api
```

#### API 클라이언트 설정
```typescript
// src/data/services/soori_service.ts
const SOORI_BASE_URL = import.meta.env.VITE_SOORI_BASE_URL

export const httpClient = new AxiosHttpClientAdapter(SOORI_BASE_URL, {
  timeout: 10 * 1000,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### 2. soo-ri-admin (관리자 앱)

#### 환경 변수 설정 (`.env`)
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyDg3qTE3ctQpoC9vwFvBvkLXXxMZjgaBfg
REACT_APP_FIREBASE_AUTH_DOMAIN=soo-ri.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=soo-ri
REACT_APP_FIREBASE_STORAGE_BUCKET=soo-ri.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=857380792687
REACT_APP_FIREBASE_APP_ID=1:857380792687:web:0350e0210062460440a09a
REACT_APP_FIREBASE_MEASUREMENT_ID=G-N8L0E0CY99

# Backend API Configuration
REACT_APP_API_URL=/api
# Firebase Hosting이 자동으로 /api를 Cloud Functions로 라우팅
```

#### API 클라이언트 설정
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};
```

---

## 🚀 배포 가이드

### 1. Firebase CLI 설치
```bash
npm install -g firebase-tools
firebase login
```

### 2. 프로젝트 초기화 (이미 완료됨)
```bash
firebase init
# Hosting, Functions, Firestore 선택
# 프로젝트: soo-ri
# 리전: asia-northeast3
```

### 3. Cloud Functions 배포
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Hosting 배포 (soo-ri-admin)
```bash
npm run build
firebase deploy --only hosting
```

### 5. Firestore Rules 배포
```bash
firebase deploy --only firestore:rules
```

### 6. 전체 배포
```bash
firebase deploy
```

---

## 🧪 로컬 개발 환경

### Firebase Emulator 사용
```bash
# Emulator 설치
firebase init emulators

# Emulator 실행
firebase emulators:start

# 특정 서비스만 실행
firebase emulators:start --only functions,firestore
```

### 로컬 개발 URL
- **Hosting**: http://localhost:5000
- **Functions**: http://localhost:5001/soo-ri/asia-northeast3/api
- **Firestore**: http://localhost:8080
- **Auth**: http://localhost:9099

### 환경 변수 설정 (로컬)
```bash
# functions/.env
SOLAPI_KEY=your_key
SOLAPI_SECRET=your_secret
SENDER_PHONE=01058922434
```

---

## ⚠️ 주의사항 및 제약사항

### 1. Firestore 제약사항
- **쿼리 제한**: 복잡한 조인 쿼리 불가 (denormalization 필요)
- **인덱스 필요**: 복합 쿼리는 사전 인덱스 생성 필요
- **트랜잭션**: 최대 500개 문서까지만 가능
- **배열 쿼리**: `array-contains`는 하나의 값만 검색 가능

### 2. Cloud Functions 제약사항
- **Cold Start**: 첫 요청 시 지연 발생 (1-3초)
- **타임아웃**: 기본 60초, 최대 540초 (9분)
- **메모리**: 기본 256MB, 최대 8GB
- **동시 실행**: 기본 1000개, 최대 3000개

### 3. 비용 관련
- **무료 할당량**:
  - Firestore: 50,000 reads/day, 20,000 writes/day
  - Functions: 2M invocations/month
  - Hosting: 10GB storage, 360MB/day transfer
- **초과 시 과금**: [Firebase Pricing](https://firebase.google.com/pricing)

### 4. Phone Authentication 설정 필수
Firebase Console에서 **Phone Authentication** 활성화 필요:
1. Firebase Console > Authentication > Sign-in method
2. Phone 활성화
3. reCAPTCHA 도메인 추가 (localhost, 배포 도메인)

---

## 📊 마이그레이션 체크리스트

### 완료된 항목
- [x] Firebase 프로젝트 생성
- [x] Firestore 데이터베이스 생성
- [x] Cloud Functions 기본 구조 구현
- [x] Phone Authentication 설정
- [x] SMS 전송 기능 (Solapi 연동)
- [x] 기본 API 엔드포인트 구현
- [x] Firebase Hosting 설정
- [x] soo-ri-admin 배포 설정

### 진행 중
- [ ] MongoDB 데이터 마이그레이션
- [ ] 통계 API 구현 (`/stats/*`)
- [ ] 관리자 인증 시스템 구현
- [ ] Firestore Security Rules 강화
- [ ] 에러 핸들링 개선

### 향후 계획
- [ ] 실시간 알림 (FCM)
- [ ] 이미지 업로드 (Firebase Storage)
- [ ] 백업 자동화
- [ ] 모니터링 및 로깅 (Cloud Logging)
- [ ] 성능 최적화

---

## 🔗 참고 자료

### Firebase 공식 문서
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore 문서](https://firebase.google.com/docs/firestore)
- [Cloud Functions 문서](https://firebase.google.com/docs/functions)
- [Firebase Hosting 문서](https://firebase.google.com/docs/hosting)
- [Firebase Auth 문서](https://firebase.google.com/docs/auth)

### 프로젝트 관련
- [기존 백엔드 README](../power_assist_device_helper_backend/README.md)
- [API 명세서 (Swagger)](https://app.swaggerhub.com/apis/Jaemani/Soorisoori/1.0.0)
- [Notion 프로젝트 페이지](https://jaeman-hyu.notion.site/1c4ec4b6449b80bca4f2d6413eb7e8ef?pvs=74)

---

## 🆘 문제 해결

### 1. API 404 에러
**증상**: `POST http://localhost:5173/users 404`

**원인**: `VITE_SOORI_BASE_URL` 환경 변수 미설정

**해결**:
```bash
# .env 파일에 추가
VITE_SOORI_BASE_URL=https://soo-ri.web.app/api
```

### 2. Phone Authentication 실패
**증상**: `400 Bad Request` on `sendVerificationCode`

**원인**: Firebase Console에서 Phone Authentication 미활성화

**해결**:
1. Firebase Console > Authentication > Sign-in method
2. Phone 활성화
3. 테스트 전화번호 추가 (선택)

### 3. CORS 에러
**증상**: `Access-Control-Allow-Origin` 에러

**해결**:
```javascript
// functions/api.js
app.use(cors({ origin: true }));
```

### 4. Cold Start 지연
**증상**: 첫 API 요청이 느림 (3-5초)

**해결**:
- Cloud Scheduler로 주기적 호출 (keep-alive)
- 최소 인스턴스 설정 (유료)
```javascript
exports.api = functions
  .runWith({ minInstances: 1 })
  .https.onRequest(app);
```

---

## 📝 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2024-12-06 | 초기 문서 작성 | 이재만 |

---

## Acknowledgement
본 프로젝트는 카카오임팩트 테크포임팩트 프로그램을 통해 개발되었습니다.
