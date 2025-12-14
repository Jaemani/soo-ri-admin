# 데이터 상태 및 더미 데이터 가이드

## 📊 현재 데이터 상태

### ✅ **실제 데이터 (Production)**

#### 1. **복지 서비스 데이터**
- **파일**: `/functions/data/한국사회보장정보원_복지서비스정보_20250722.csv`
- **개수**: 20,000+ 서비스
- **출처**: 한국사회보장정보원 공식 데이터
- **상태**: ✅ 실제 데이터
- **사용**: 복지 서비스 추천 시 사용

#### 2. **GPS 주행 데이터 API**
- **API**: `https://test-web2.star-pickers.com/v2/vehicle/mileage`
- **데이터 기간**: 2025년 8월 7일 ~ 현재
- **출처**: 성동구 실시간 주행 데이터
- **상태**: ✅ 실제 데이터
- **사용**: 사용자 이동거리 및 추세 분석

#### 3. **센서 ID 매핑**
- **파일**: `/functions/data/사용자센서정보.csv`
- **개수**: 5개 센서
- **상태**: ✅ 실제 센서 ID
- **사용**: GPS 데이터 조회 시 사용

---

### ⚠️ **더미/Fallback 데이터**

#### 1. **사용자 센서 ID 매핑**
- **위치**: Firestore `users` 컬렉션의 `sensorId` 필드
- **상태**: ❌ 대부분 없음 (수동 추가 필요)
- **Fallback**: 센서 ID 없으면 주행거리 0km로 처리

#### 2. **통계 카드 데이터**
```typescript
// 현재 하드코딩된 더미 데이터
<StatCard>마지막 점검: {recentSelfChecks}주 전</StatCard>
<StatCard>다음 점검: 이번 주</StatCard>  // ← 더미
<StatCard>가까운 센터: 은평센터</StatCard>  // ← 더미
```

#### 3. **주의 알림 조건**
```typescript
// 수리 이력이 있을 때만 표시
{viewModel.report.metadata.recentRepairs > 0 && (
  <AlertCard>점검 시기가 다가왔어요</AlertCard>
)}
```

---

## 🔧 사용자별 더미 데이터 추가 방법

### ⚠️ **중요: 센서 ID는 GPS 데이터 조회용입니다**

**센서 ID를 추가해도 사용자 이름이나 인증 정보는 변경되지 않습니다!**

- ✅ **센서 ID**: GPS API 호출 시 사용하는 차량 식별자
- ✅ **사용자 인증**: Firebase Authentication (전화번호/UID)
- ✅ **사용자 정보**: Firestore users 컬렉션 (이름, 전화번호 등)

**센서 ID는 단순히 "이 사용자의 GPS 데이터를 어디서 가져올지" 알려주는 참조 값입니다.**

### **방법 1: Firestore Console에서 직접 추가 (추천)**

#### Step 1: 로그인한 사용자의 UID 확인
```
앱에서 로그인 → 브라우저 콘솔 확인
🔑 Current User ID: HpErhmIUaoc2q2v9yxkXjji375y2
```

#### Step 2: Firestore에서 해당 사용자 문서에 센서 ID 추가
```
Firebase Console → Firestore → users → {위에서 확인한 UID}
→ 필드 추가:
  sensorId: "450088830181480"  (5개 중 하나 선택)
```

**이렇게 하면**:
- ✅ 로그인한 사용자 그대로 유지
- ✅ 해당 사용자의 GPS 데이터만 조회 가능
- ✅ 다른 사용자 정보는 변경 없음

**사용 가능한 센서 ID**:
- `450088830181480`
- `450088830181618`
- `450088830181747`
- `450088830181754`
- `450088830181755`

#### Step 3: 리포트 재생성
```
앱에서 "리포트 생성하기" 버튼 클릭
→ GPS 데이터가 실제로 조회됨
```

---

### **방법 2: 스크립트로 일괄 추가**

```javascript
// scripts/add-sensor-id.js
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'soo-ri' });
const db = admin.firestore();

async function addSensorId(phoneNumber, sensorId) {
  const usersSnap = await db.collection('users')
    .where('phoneNumber', '==', phoneNumber)
    .get();
  
  if (usersSnap.empty) {
    console.log('User not found');
    return;
  }
  
  const userId = usersSnap.docs[0].id;
  await db.collection('users').doc(userId).update({
    sensorId: sensorId
  });
  
  console.log(`✅ Added sensorId ${sensorId} to user ${userId}`);
}

// 실행
addSensorId('01012341234', '450088830181480');
```

---

## 📍 실제 GPS 데이터 확인

### **테스트 스크립트 실행**
```bash
cd /home/jaeman/Codes/soo-ri/soo-ri-admin
node scripts/test-gps-api.js
```

**출력 예시**:
```
📍 Testing GPS API Connection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Test 1: Fetch today's data for sensor 450088830181480
✅ Success! Received 144 records
📊 Sample data:
   - SNR_ID: 450088830181480
   - RD_DT: 20251207
   - TOT_TM: 120 (minutes)
   - TOT_DTN: 15.5 (km)
```

---

## 🎯 실제 데이터 흐름

### **사용자가 리포트 생성 시**

```
1. 사용자 UID 확인
   ↓
2. Firestore users/{userId} 조회
   ↓
3. sensorId 필드 확인
   ↓
4-A. sensorId 있음                    4-B. sensorId 없음
   ↓                                    ↓
   GPS API 호출                         주행거리 0km
   (실제 데이터)                        (Fallback)
   ↓                                    ↓
   최근 7일 집계                        추세: stable
   ↓                                    ↓
5. repairs/selfChecks 조회 (실제 데이터)
   ↓
6. GPT-4o 분석 (실제 AI)
   ↓
7. 복지 서비스 추천 (실제 데이터)
   ↓
8. Firestore 저장
```

---

## 🔍 현재 01012341234 계정 상태

### **확인 방법**
```bash
# Firebase Console
Authentication → 사용자 검색: 01012341234
Firestore → users → {userId} → sensorId 필드 확인
```

### **예상 상태**
```
phoneNumber: "01012341234"
name: "테스트 사용자"
vehicleId: "vehicle-xxx"
sensorId: ❌ 없음 (추가 필요)
```

### **센서 ID 추가 후**
```
✅ sensorId: "450088830181480"
→ GPS API 호출 가능
→ 실제 주행거리 표시
→ 실제 추세 분석
```

---

## 💡 권장 사항

### **테스트용 계정 설정**
```
01012341234 → sensorId: "450088830181480"
01012341233 → sensorId: "450088830181618"
```

### **실제 데이터 확인**
1. 센서 ID 추가
2. 리포트 생성
3. 콘솔 로그 확인:
   ```
   📍 Fetching GPS data for sensor: 450088830181480
   ✅ GPS data retrieved: { totalDistance: XX.X, trend: 'stable' }
   ```

---

## 📝 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 복지 서비스 데이터 | ✅ 실제 | 20,000+ 서비스 |
| GPS API | ✅ 실제 | 성동구 실시간 데이터 |
| 센서 ID 매핑 | ⚠️ 수동 추가 필요 | Firestore users 컬렉션 |
| 수리/점검 이력 | ✅ 실제 | repairs/selfChecks 컬렉션 |
| AI 분석 | ✅ 실제 | GPT-4o |
| 통계 카드 일부 | ❌ 더미 | "다음 점검", "가까운 센터" |

**결론**: GPS 데이터는 실제 API이지만, 사용자별 센서 ID 매핑이 필요합니다.
