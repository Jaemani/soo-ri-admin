# Firebase Cloud Functions API 엔드포인트 목록

## 배포 전 체크리스트
- [x] POST /users - 사용자 존재 확인 및 등록
- [x] GET /users/role - 사용자 역할 조회
- [x] GET /vehicles/me - 내 차량 정보
- [x] GET /vehicles/:vehicleId/repairs/:repairId - 수리 상세
- [x] POST /vehicles/:vehicleId/selfCheck - 자가진단 생성
- [x] GET /vehicles/:vehicleId/selfCheck - 자가진단 목록
- [x] GET /vehicles/:vehicleId/selfCheck/:selfCheckId - 자가진단 상세
- [x] GET /repairStations - 수리센터 목록

---

## 인증 (Auth)

### POST /admin/login
관리자 로그인 (임시 구현)
- **Body**: `{ id, password }`
- **Response**: `{ success, token, admin }`

---

## 사용자 (Users)

### POST /users
사용자 존재 확인 또는 신규 등록
- **Headers**: `Authorization: Bearer <token>`
- **Body (빈 객체)**: 사용자 존재 확인
  - 200: 신규 사용자
  - 409: 이미 존재하는 사용자
- **Body (데이터 포함)**: 신규 사용자 등록
  ```json
  {
    "name": "홍길동",
    "vehicleId": "uuid",
    "model": "전동휠체어",
    "purchasedAt": "2024-01-01T00:00:00.000Z",
    "manufacturedAt": "2024-01-01T00:00:00.000Z",
    "recipientType": "disabled",
    "supportedDistrict": "서울시 강남구"
  }
  ```
- **Response**: `{ userId, name, phoneNumber, role, recipientType, vehicleId }`

### GET /users/role
현재 로그인한 사용자의 역할 조회
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ role: "user" | "admin" | "repairer" | "guardian" }`

### GET /users
사용자 목록 조회 (관리자용)
- **Query**: `limit` (default: 50, max: 200)
- **Response**: `{ success, users, totalPages, currentPage, total }`

### GET /users/:id
사용자 상세 조회
- **Response**: `{ _id, name, phoneNumber, role, ... }`

---

## 차량 (Vehicles)

### GET /vehicles/me
현재 로그인한 사용자의 차량 정보
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "vehicleId": "uuid",
    "userId": "user_doc_id",
    "model": "전동휠체어",
    "purchasedAt": "2024-01-01T00:00:00.000Z",
    "manufacturedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

### GET /vehicles/:vehicleId
차량 정보 조회
- **Response**: 
  ```json
  {
    "_id": "doc_id",
    "vehicleId": "uuid",
    "userId": "user_doc_id",
    "model": "전동휠체어",
    "purchasedAt": "2024-01-01T00:00:00.000Z",
    "manufacturedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

---

## 수리 (Repairs)

### GET /repairs
수리 이력 목록 (필터링 가능)
- **Query**: `limit`, `vehicleId`
- **Response**: `{ repairs, totalPages, currentPage, total }`

### GET /admin/repairs
관리자용 수리 이력 목록
- **Query**: `limit`, `repairStationCode`
- **Response**: `{ repairs, totalPages, currentPage, total }`

### GET /vehicles/:vehicleId/repairs
특정 차량의 수리 이력 목록
- **Response**: `{ repairs: [...] }`

### GET /vehicles/:vehicleId/repairs/:repairId
특정 수리 이력 상세 조회
- **Response**: `{ _id, vehicleId, repairedAt, billingPrice, ... }`

### POST /vehicles/:vehicleId/repairs
수리 이력 등록
- **Body**:
  ```json
  {
    "repairedAt": "2024-01-01T00:00:00.000Z",
    "billingPrice": 50000,
    "isAccident": false,
    "repairStationCode": "ST01",
    "repairStationLabel": "강남수리센터",
    "repairer": "김수리",
    "repairCategories": ["타이어", "배터리"],
    "batteryVoltage": 36.5,
    "etcRepairParts": "배터리 교체",
    "memo": "정기 점검"
  }
  ```
- **Response**: `{ _id, ... }`

---

## 자가진단 (SelfCheck)

### POST /vehicles/:vehicleId/selfCheck
자가진단 등록
- **Body**:
  ```json
  {
    "motorNoise": false,
    "abnormalSpeed": false,
    "batteryBlinking": true,
    "chargingNotStart": false,
    "breakDelay": false,
    "breakPadIssue": false,
    "tubePunctureFrequent": false,
    "tireWearFrequent": false,
    "batteryDischargeFast": true,
    "incompleteCharging": false,
    "seatUnstable": false,
    "seatCoverIssue": false,
    "footRestLoose": false,
    "antislipWorn": false,
    "frameNoise": false,
    "frameCrack": false
  }
  ```
- **Response**: `{ success: true, _id }`

### GET /vehicles/:vehicleId/selfCheck
특정 차량의 자가진단 목록
- **Response**: `{ selfChecks: [...] }`

### GET /vehicles/:vehicleId/selfCheck/:selfCheckId
자가진단 상세 조회
- **Response**: `{ _id, vehicleId, motorNoise, ... }`

### GET /selfChecks
자가진단 목록 (필터링 가능)
- **Query**: `limit`, `vehicleId`
- **Response**: `{ selfChecks, totalPages, currentPage, total }`

### GET /admin/selfChecks
관리자용 자가진단 목록
- **Query**: `limit`, `userId`
- **Response**: `{ selfChecks, totalPages, currentPage, total }`

---

## 수리센터 (RepairStations)

### GET /repairStations
수리센터 목록 조회
- **Query (선택)**: `admin=current` (관리자용 단일 조회)
- **Response (사용자)**:
  ```json
  {
    "stations": [
      {
        "code": "ST01",
        "state": "서울",
        "city": "서울",
        "region": "강남구",
        "address": "서울시 강남구 테헤란로 123",
        "label": "강남보장구수리센터",
        "telephone": "02-1234-5678",
        "coordinate": [127.12345, 37.12345]
      }
    ]
  }
  ```
- **Response (관리자)**: `{ success: true, repairStation: {...} }`

### PUT /repairStations
수리센터 정보 수정 (관리자용)
- **Body**: `{ aid: [30000, 40000, 50000] }`
- **Response**: `{ success: true, repairStation }`

---

## 통계 (Stats)

### GET /stats/overall
전체 통계 (미구현)
- **Response**: `{ ok: true }`

### GET /stats/repairs
수리 통계 (미구현)
- **Response**: `{ totalRepairs, totalCost, averageCost, ... }`

### GET /stats/users
사용자 통계 (미구현)
- **Response**: `{ totalUsers, usersByType, activeUsers, ... }`

### GET /stats/monthly/:year/:month
월별 통계 (미구현)
- **Response**: `{ ok: true, year, month }`

### GET /stats/export
통계 내보내기 (미구현)
- **Response**: `{ ok: true }`

---

## 배포 명령어

```bash
# Functions만 배포
firebase deploy --only functions

# 전체 배포
firebase deploy

# 특정 function만 배포
firebase deploy --only functions:api
```

---

## 테스트 URL

### Production
```
https://asia-northeast3-soo-ri.cloudfunctions.net/api
```

### Firebase Hosting (Rewrite)
```
https://soo-ri.web.app/api
```

### Local Emulator
```
http://localhost:5001/soo-ri/asia-northeast3/api
```

---

## 주의사항

1. **인증 필수**: 대부분의 엔드포인트는 Firebase Auth 토큰 필요
2. **Timestamp 변환**: Firestore Timestamp는 자동으로 ISO String으로 변환
3. **CORS**: 모든 origin 허용 (`cors({ origin: true })`)
4. **에러 처리**: 모든 엔드포인트에 try-catch 구현
5. **Limit**: 기본 50, 최대 200개 제한

---

## 다음 작업

- [ ] 통계 API 구현
- [ ] 관리자 인증 강화
- [ ] Firestore Security Rules 설정
- [ ] 페이지네이션 개선
- [ ] 검색 기능 추가
- [ ] 에러 로깅 강화
