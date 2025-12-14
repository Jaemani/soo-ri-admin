# GPS API 디버깅 및 에러 수정 로그 (6차)

## 🐛 문제 상황

### **증상**
- 5차 배포 후 리포트 생성 시 "포트가 생성되었지만 불러오는데 실패했습니다" 에러 발생.
- 실제 에러 로그: `Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.`

### **원인 분석**
- `gpsDataFetcher.js`에서 반환하는 `debugInfo` 객체 내에 `undefined` 값이 포함되었을 가능성.
- Firestore는 `undefined` 값을 저장할 수 없음.
- 특히 `firstRecord`가 API 응답 객체 그대로 들어가면서 내부적으로 문제가 될 수 있음.

### **해결 방법**
- **Debug Info 안전 처리**: 
  - `undefined` 값이 들어갈 수 있는 곳에 `null` 처리.
  - `firstRecord` 객체는 `JSON.stringify`로 문자열 변환하여 저장.

```javascript
    const debugInfo = {
      inputSensorId: sensorId || null,
      allDataCount: allData ? allData.length : 0,
      filteredDataCount: filteredData ? filteredData.length : 0,
      firstRecord: (allData && allData.length > 0) ? JSON.stringify(allData[0]) : null,
      days,
      today: today.toISOString()
    };
```

---

## 🚀 배포 완료

```bash
firebase deploy --only functions:api
```
- 배포 시간: ~2분
- 상태: ✅ 성공

---

## 🧪 확인 방법

1. **앱 새로고침** 및 **"리포트 생성하기"**
2. **에러 없이 리포트가 생성되어야 함.**
3. **주행거리 확인**: 0km가 아닌 값이 나와야 함.
4. 만약 0km라면 콘솔의 `debug` 정보를 통해 원인 파악 가능.
