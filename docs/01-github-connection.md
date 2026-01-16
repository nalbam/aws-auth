# 1단계: Auth0에서 GitHub 연결 설정

이 가이드에서는 Auth0에서 GitHub을 Social Connection으로 설정하는 방법을 안내합니다.

## 사전 요구사항

- Auth0 계정 ([auth0.com](https://auth0.com)에서 가입)
- GitHub 계정 또는 조직

## 단계

### 1. GitHub OAuth App 생성 (선택사항 - Auth0 기본값 사용 가능)

Auth0는 테스트용 기본 GitHub OAuth 앱을 제공하지만, 프로덕션 환경에서는 직접 생성해야 합니다:

1. GitHub Settings → Developer settings → OAuth Apps → New OAuth App으로 이동
2. 세부정보 입력:
   - **Application name**: `Auth0 - AWS Federation`
   - **Homepage URL**: `https://YOUR_AUTH0_DOMAIN`
   - **Authorization callback URL**: `https://YOUR_AUTH0_DOMAIN/login/callback`
3. **Register application** 클릭
4. **Client ID**를 기록하고 **Client Secret** 생성

### 2. Auth0에서 GitHub 연결 활성화

1. [Auth0 Dashboard](https://manage.auth0.com)에 로그인
2. **Authentication** → **Social**로 이동
3. **GitHub** 클릭
4. 연결 구성:

   **자체 GitHub OAuth App 사용 시:**
   - **Use your own credentials** 토글 활성화
   - GitHub의 **Client ID** 입력
   - GitHub의 **Client Secret** 입력

   **Auth0 기본값 사용 시 (테스트 전용):**
   - 기본 자격 증명 유지

5. **Permissions** 탭 클릭
6. 다음 스코프 활성화:
   - ✅ `user:email` (사용자 이메일 가져오기)
   - ✅ `read:org` (조직 멤버십 가져오기)
   - ✅ `read:user` (사용자 프로필 가져오기)

7. **Attributes**에서 다음 항목 활성화 확인:
   - Email
   - Email Verified
   - Name
   - Username
   - Picture

### 3. 연결 설정 구성

1. **Settings** 탭에서:
   - **Name**: `github`으로 유지
   - **Sync user profile attributes at each login**: ✅ 활성화 (권장)

2. **Save Changes** 클릭

### 4. 연결 테스트

1. GitHub 연결 페이지에서 **Try Connection** 클릭
2. GitHub으로 리다이렉트되어 인증 진행
3. 애플리케이션 승인
4. 사용자 프로필과 함께 성공 메시지 표시

## 고급 구성

### 조직 제한

특정 GitHub 조직에 대한 접근을 제한하려면 Auth0 Rule을 추가할 수 있습니다 (4단계에서 다룸).

### 팀 기반 접근

GitHub 팀을 AWS 그룹에 매핑하려면:
1. 필요한 경우 추가 스코프 요청
2. 팀 멤버십을 가져오는 Auth0 Action/Rule 생성
3. 팀을 SAML 그룹 속성에 매핑

## 문제 해결

### "Access Denied" 오류

- GitHub OAuth 앱 콜백 URL이 정확히 일치하는지 확인: `https://YOUR_AUTH0_DOMAIN/login/callback`
- GitHub에서 OAuth 앱이 일시 중지되지 않았는지 확인

### 이메일 누락

- `user:email` 스코프가 활성화되어 있는지 확인
- 사용자가 GitHub 프로필에 공개 이메일을 설정했는지 확인
- 이메일이 비공개인 경우 Auth0가 가져오지 못할 수 있음

### 조직 누락

- `read:org` 스코프가 활성화되어 있는지 확인
- 사용자가 조직 데이터 접근 권한을 부여해야 함
- 비공개 조직은 명시적 승인 필요

## 다음 단계

[2단계: Auth0에서 SAML 애플리케이션 구성](02-auth0-saml-config.md)으로 진행
