# 3단계: AWS IAM Identity Center 구성

이 가이드에서는 Auth0를 외부 SAML ID 제공자로 사용하도록 AWS IAM Identity Center(구 AWS SSO)를 구성하는 방법을 안내합니다.

## 사전 요구사항

- IAM Identity Center가 활성화된 AWS 계정
- AWS IAM Identity Center에 대한 관리자 접근 권한
- 2단계에서 생성한 Auth0 SAML 애플리케이션

> **참고**: 2단계와 이 단계는 상호 의존적입니다. 이 단계에서 AWS 구성 중에 얻은 정보(ACS URL, Audience 등)를 2단계의 Auth0 설정에 다시 업데이트해야 합니다.

## 단계

### 1. IAM Identity Center 활성화

1. [AWS Management Console](https://console.aws.amazon.com)에 로그인
2. **IAM Identity Center**로 이동 ("IAM Identity Center" 또는 "SSO" 검색)
3. 아직 활성화되지 않은 경우 **Enable** 클릭하여 IAM Identity Center 활성화
4. 리전 선택 (홈 리전이 됨)
5. **Enable with AWS Organizations** 또는 **Enable** (독립형) 선택

### 2. ID 소스를 외부 IdP로 변경

1. IAM Identity Center에서 **Settings**로 이동
2. **Identity source**에서 **Actions** → **Change identity source** 클릭
3. **External identity provider** 선택
4. **Next** 클릭

### 3. SAML 2.0 설정 구성

두 가지를 제공해야 합니다:

#### A. IdP SAML 메타데이터

**옵션 1: 메타데이터 파일 업로드**
1. Auth0에서 메타데이터 다운로드:
   ```
   https://YOUR_AUTH0_DOMAIN/samlp/metadata/YOUR_CLIENT_ID
   ```
   - `YOUR_AUTH0_DOMAIN`: Auth0 테넌트 도메인
   - `YOUR_CLIENT_ID`: 2단계에서 생성한 애플리케이션의 Client ID
2. `auth0-metadata.xml`로 저장
3. 파일 업로드

**옵션 2: 메타데이터 URL 입력**
1. Auth0 메타데이터 URL 직접 입력:
   ```
   https://YOUR_AUTH0_DOMAIN/samlp/metadata/YOUR_CLIENT_ID
   ```

#### B. Service Provider 메타데이터 (중요!)

AWS가 Service Provider 메타데이터를 표시합니다. **이 정보를 반드시 기록하세요**:

1. **IAM Identity Center Assertion Consumer Service (ACS) URL**:
   ```
   https://YOUR_IDENTITY_CENTER_DOMAIN.awsapps.com/start/saml2/acs
   ```
   예: `https://d-1234567890.awsapps.com/start/saml2/acs`

2. **IAM Identity Center issuer URL**:
   ```
   https://YOUR_IDENTITY_CENTER_DOMAIN.awsapps.com/start
   ```

3. 이 값들을 기록해두세요 - **2단계로 돌아가서 Auth0 SAML 설정을 업데이트해야 합니다**.

#### Auth0 설정 업데이트 (2단계로 돌아가기)

1. Auth0 Dashboard → Applications → AWS IAM Identity Center → Addons → SAML2 Web App
2. **Application Callback URL**을 ACS URL로 업데이트
3. Settings JSON의 `destination`과 `audience` 값을 업데이트:
   - `destination`: ACS URL
   - `audience`: IAM Identity Center issuer URL
4. **Save** 클릭

5. AWS 콘솔로 돌아와서 **Next** 클릭

### 4. 속성 매핑 구성

Auth0에서 AWS IAM Identity Center로 SAML 속성 매핑:

| Subject (SAML) | Maps to (IAM Identity Center) |
|----------------|-------------------------------|
| `${user.email}` | Subject (필수) |

| Attributes (SAML) | Maps to (IAM Identity Center) |
|-------------------|-------------------------------|
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | email (필수) |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` | name |
| `https://aws.amazon.com/SAML/Attributes/RoleSessionName` | userName |

**참고**: 속성 이름은 Auth0가 SAML 어설션에서 보내는 것과 정확히 일치해야 합니다.

5. **Review and confirm** 클릭
6. **ACCEPT** 입력하여 변경 확인
7. **Change identity source** 클릭

### 5. ID 소스 확인

1. ID 소스 변경이 완료될 때까지 대기 (몇 분 소요될 수 있음)
2. **Settings** → **Identity source**로 이동
3. 상태가 **External identity provider (SAML 2.0)**으로 표시되어야 함

### 6. AWS 계정에 대한 사용자 접근 구성

#### 권한 세트 생성

1. IAM Identity Center에서 **Permission sets**로 이동
2. **Create permission set** 클릭
3. 사전 정의된 세트 선택 (예: **AdministratorAccess**, **ViewOnlyAccess**) 또는 커스텀 생성
4. 이름 지정 (예: `AdminAccess`)
5. 세션 기간 설정
6. **Create** 클릭

#### AWS 계정에 사용자 할당

1. **AWS accounts**로 이동
2. AWS 계정 선택
3. **Assign users or groups** 클릭
4. **Next: Permission sets** 클릭

**중요**: 외부 IdP를 사용하므로 사용자가 아직 IAM Identity Center에 존재하지 않습니다. 첫 로그인 시 생성됩니다.

현재 다음을 수행할 수 있습니다:
- 사용자가 로그인할 때까지 대기 (JIT 프로비저닝)
- 또는 일치하는 이메일 주소로 수동으로 사용자 생성

### 7. 사용자 포털 URL 가져오기

1. IAM Identity Center에서 **Dashboard**로 이동
2. **User portal URL** 복사 (예: `https://d-1234567890.awsapps.com/start`)
3. 이 URL을 사용자와 공유 - 로그인 위치

## 구성 완료 체크리스트

이 단계를 완료한 후 다음을 확인하세요:

- [ ] AWS IAM Identity Center가 외부 IdP로 구성됨
- [ ] Auth0 SAML 설정이 AWS ACS URL 및 Audience로 업데이트됨
- [ ] 최소 하나의 권한 세트가 생성됨
- [ ] 사용자 포털 URL을 기록함

## 초기 구성 테스트

1. 시크릿/프라이빗 브라우저 창에서 사용자 포털 URL 열기
2. Auth0로 리다이렉트되어야 함
3. "Login with GitHub" 클릭
4. GitHub으로 인증
5. AWS로 다시 리다이렉트되어야 함
6. 첫 로그인 시 IAM Identity Center에 사용자 생성

## 사용자 프로비저닝

AWS IAM Identity Center는 외부 IdP와 함께 Just-In-Time (JIT) 프로비저닝을 지원합니다:

- 첫 로그인 시 사용자 계정 자동 생성
- 각 로그인 시 SAML 어설션에서 사용자 속성 업데이트
- SAML 어설션의 NameID(subject)로 사용자 식별

### 중요 사항

- **사용자 삭제**: GitHub에서 제거해도 사용자가 자동으로 삭제되지 않음
- **속성 업데이트**: 각 로그인 시 사용자 속성 업데이트
- **그룹 멤버십**: 추가 구성 필요 (4단계 참조)

## 문제 해결

### "Invalid SAML Response" 오류

- Auth0와 AWS 모두에서 메타데이터가 올바르게 구성되었는지 확인
- ACS URL이 정확히 일치하는지 확인
- SAML 응답이 서명되었는지 확인

### 사용자가 프로비저닝되지 않음

- SAML 어설션의 이메일이 정확히 일치하는지 확인
- 속성 매핑이 올바른지 확인
- SAML 오류에 대한 CloudTrail 로그 확인

### AWS 계정에 접근할 수 없음

- 사용자가 권한 세트에 할당되어 있어야 함
- 권한 세트가 AWS 계정에 연결되어 있는지 확인
- 사용자가 최소 한 번 로그인했는지 확인 (JIT 프로비저닝용)

### 시간 동기화 오류

- Auth0와 AWS 시스템의 시간이 동기화되어 있는지 확인
- SAML 어설션의 `NotBefore`와 `NotOnOrAfter` 확인
- 필요시 세션 기간 조정

## 다음 단계

[4단계: 속성 매핑 설정](04-attribute-mappings.md)으로 진행
