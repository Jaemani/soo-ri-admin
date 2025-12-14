# Deployment Issue Log - 2025-12-07

## Issue: GitHub Actions 배포 후 API 연결 실패

### 증상
- 로컬 개발 환경(`pnpm dev`)에서는 정상 작동
- GitHub Actions를 통해 빌드/배포 후 프로덕션에서 API 호출 실패
- 에러: `POST https://soo-ri-back.kro.kr/api/users net::ERR_CONNECTION_REFUSED`

### 원인 분석

1. **환경변수 불일치**
   - 로컬: `.env` 파일에서 `VITE_SOORI_BASE_URL=https://asia-northeast3-soo-ri.cloudfunctions.net/api`
   - GitHub Actions: Secrets에 `VITE_SOORI_BASE_URL=https://soo-ri-back.kro.kr` (잘못된 값)

2. **Vite 빌드 동작 방식**
   - Vite는 빌드 타임에 `import.meta.env.VITE_*` 환경변수를 실제 값으로 대체
   - 런타임에는 환경변수를 읽을 수 없음
   - 따라서 GitHub Actions에서 빌드 시 잘못된 URL이 번들에 하드코딩됨

3. **확인된 사실**
   - 로컬 빌드 결과: `https://asia-northeast3-soo-ri.cloudfunctions.net/api` (정상)
   - GitHub Actions 빌드 결과: `https://soo-ri-back.kro.kr` (잘못됨)

### 해결 방법

#### 1. GitHub Repository Secrets 수정
```
Repository → Settings → Secrets and variables → Actions
```

**수정 필요한 Secret:**
- Key: `VITE_SOORI_BASE_URL`
- 현재 값: `https://soo-ri-back.kro.kr`
- 올바른 값: `https://asia-northeast3-soo-ri.cloudfunctions.net/api`

#### 2. 재배포
Secrets 수정 후:
```bash
git commit --allow-empty -m "chore: trigger redeploy with correct API URL"
git push origin main
```

### 관련 파일

**환경변수 사용 위치:**
- `/src/data/services/soori_service.ts` - `const SOORI_BASE_URL = import.meta.env.VITE_SOORI_BASE_URL`
- `/src/presentation/pages/WelfareReportPage/WelfareReportPageViewModel.ts` - `const API_URL = import.meta.env.VITE_SOORI_BASE_URL`

**GitHub Actions 워크플로우:**
- `/.github/workflows/firebase-hosting-merge.yml`
- Build step에 환경변수 주입:
  ```yaml
  - name: Build
    run: pnpm build
    env:
      VITE_SOORI_BASE_URL: ${{ secrets.VITE_SOORI_BASE_URL }}
  ```

### 예방 조치

1. **`.env.example` 파일 유지**
   - 모든 필수 환경변수 문서화
   - 올바른 값의 예시 제공

2. **빌드 검증**
   - CI/CD에서 빌드 후 번들 내용 검증
   - 환경변수가 올바르게 주입되었는지 확인

3. **환경변수 네이밍 규칙**
   - Vite: `VITE_` 접두사 필수
   - 빌드 타임에만 사용 가능
   - 민감한 정보는 백엔드에서만 사용

### 참고 사항

**Vite 환경변수 동작:**
- `import.meta.env.VITE_*`: 빌드 타임에 문자열로 대체
- 클라이언트 번들에 포함됨 (민감한 정보 주의)
- `.env` 파일은 개발 환경에서만 사용
- 프로덕션은 빌드 시 환경변수로 주입

**Firebase Cloud Functions URL 형식:**
```
https://{region}-{project-id}.cloudfunctions.net/{function-name}
```

현재 프로젝트:
- Region: `asia-northeast3`
- Project ID: `soo-ri`
- Function Name: `api`
- Full URL: `https://asia-northeast3-soo-ri.cloudfunctions.net/api`
