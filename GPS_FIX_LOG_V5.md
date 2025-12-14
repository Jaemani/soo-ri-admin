# GPS API 디버깅 로그 (5차)

## 🐛 문제 상황

### **증상**
- 4차 배포 후에도 주행거리가 0km라고 사용자가 보고함 (4차 배포 결과인지 확실치 않으나, 사용자가 3차 배포 결과를 보고 말한 것일 수도 있음).
- 하지만 0km가 계속 나온다면 디버깅 정보가 필요함.

### **해결 방법**
1. **디버그 정보 추가**: API 응답에 `debug` 필드 추가.
   - `inputSensorId`: 입력받은 센서 ID
   - `allDataCount`: API로부터 받은 전체 데이터 개수
   - `filteredDataCount`: 필터링 후 데이터 개수
   - `firstRecord`: 첫 번째 레코드 샘플 (SNR_ID 확인용)
   - `today`: 기준 날짜

2. **안전성 강화**: `filteredData` 로직에서 `record` 및 `record.SNR_ID` 존재 여부 체크 추가.

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
2. **콘솔 확인**: 브라우저 개발자 도구 콘솔에서 `report.metadata.debug` 또는 로그 객체 확인.
   - `allDataCount > 0` 이고 `filteredDataCount == 0` 이면 필터링 문제.
   - `allDataCount == 0` 이면 API 호출 문제 (또는 날짜 문제).

만약 여전히 0km라면, 콘솔에 찍힌 `debug` 정보를 알려주시면 즉시 원인을 찾을 수 있습니다.
