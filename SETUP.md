# 🚀 수리수리 관리자 앱 설정 가이드

## 빠른 시작

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

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
REACT_APP_API_URL=https://asia-northeast3-soo-ri.cloudfunctions.net/api

# Optional: Security Keys (for JWT, encryption)
HASHIDS_SALT=soorisoorisogum
PEPPER=soorisoorihuchu
ENCRYPT_PASSWORD=catchthemoon
JWT_SECRET=soorisoorijwt
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm start
```

브라우저에서 http://localhost:3000 으로 접속

### 4. 빌드

```bash
npm run build
```

### 5. Firebase 배포

```bash
firebase deploy
```

---

## Firebase Console 설정

### Phone Authentication 활성화

1. [Firebase Console](https://console.firebase.google.com/project/soo-ri) 접속
2. **Authentication** > **Sign-in method** 클릭
3. **Phone** 활성화
4. **reCAPTCHA 도메인 추가**:
   - `localhost`
   - `soo-ri.web.app`
   - 기타 배포 도메인

### Firestore 데이터베이스

1. **Firestore Database** 생성 (이미 완료됨)
2. **리전**: asia-northeast3 (서울)
3. **보안 규칙**: 기본 설정 사용 (추후 강화 필요)

---

## 주요 기능

### 관리자 기능
- 사용자 목록 조회
- 수리 이력 관리
- 차량 정보 조회
- 통계 대시보드 (개발 중)

### API 엔드포인트
- `/api/users` - 사용자 관리
- `/api/repairs` - 수리 이력
- `/api/vehicles` - 차량 정보
- `/api/repairStations` - 수리센터 관리

---

## 문제 해결

### API 404 에러
- `.env` 파일에 `REACT_APP_API_URL` 설정 확인
- Firebase Functions가 배포되었는지 확인

### 인증 실패
- Firebase Console에서 Phone Authentication 활성화 확인
- reCAPTCHA 도메인 추가 확인

---

## 참고 문서

- [Firebase Migration 가이드](./FIREBASE_MIGRATION.md)
- [프로젝트 README](./README.md)
