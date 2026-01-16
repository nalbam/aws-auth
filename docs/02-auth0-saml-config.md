# 2단계: Auth0에서 SAML 애플리케이션 구성

이 가이드에서는 AWS IAM Identity Center의 ID 제공자(IdP)로 작동할 SAML 애플리케이션을 Auth0에서 생성하는 방법을 안내합니다.

## 사전 요구사항

- Auth0 계정 ([auth0.com](https://auth0.com)에서 가입)
- 1단계에서 구성한 GitHub 연결
- AWS IAM Identity Center가 활성화된 AWS 계정

> **참고**: 이 단계와 3단계(AWS IAM Identity Center 구성)는 상호 의존적입니다. 먼저 이 단계에서 기본 SAML 애플리케이션을 생성한 후, 3단계에서 AWS 구성을 완료하고, 다시 이 단계로 돌아와 정확한 콜백 URL을 업데이트해야 합니다.

## 단계

### 1. 새 애플리케이션 생성

1. [Auth0 Dashboard](https://manage.auth0.com)에서 **Applications** → **Applications**로 이동
2. **Create Application** 클릭
3. 구성:
   - **Name**: `AWS IAM Identity Center`
   - **Application Type**: **Regular Web Application**
4. **Create** 클릭

### 2. 애플리케이션을 SAML IdP로 구성

1. **Addons** 탭으로 이동
2. **SAML2 Web App** 활성화
3. **SAML2 Web App**을 클릭하여 구성

### 3. SAML 설정 구성

SAML 구성 대화상자에서:

#### Application Callback URL

AWS IAM Identity Center를 사용하는 경우 **ACS(Assertion Consumer Service) URL**을 입력합니다:

```
https://YOUR_REGION.signin.aws.amazon.com/platform/saml/acs/YOUR_ACS_ID
```

- `YOUR_REGION`: AWS 리전 (예: `ap-northeast-2`)
- `YOUR_ACS_ID`: AWS에서 제공하는 ACS UUID
- 이 URL은 3단계에서 AWS IAM Identity Center의 SAML 메타데이터에서 확인할 수 있습니다

> **중요**: 처음에는 플레이스홀더 값을 입력하고, 3단계 완료 후 실제 URL로 업데이트하세요.

#### Settings (JSON)

```json
{
  "audience": "https://ap-northeast-2.signin.aws.amazon.com/platform/saml/d-9b6753d2be",
  "destination": "https://ap-northeast-2.signin.aws.amazon.com/platform/saml/acs/49434e2d4805a7b2-f152-44d2-9f6b-62b379a23c28",
  "mappings": {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    "nickname": "https://aws.amazon.com/SAML/Attributes/RoleSessionName"
  },
  "nameIdentifierFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  "nameIdentifierProbes": [
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
  ],
  "signatureAlgorithm": "rsa-sha256",
  "digestAlgorithm": "sha256",
  "lifetimeInSeconds": 3600,
  "signResponse": true,
  "includeAttributeNameFormat": true,
  "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
}
```

**중요**: 위 값들을 AWS IAM Identity Center SAML 메타데이터의 실제 값으로 교체하세요:
- `audience`: 메타데이터의 `entityID` 값
- `destination`: 메타데이터의 `AssertionConsumerService Location` 값

4. **Enable**을 클릭한 후 **Save**

### 4. SAML 메타데이터 다운로드

1. SAML2 Web App 애드온 구성에서 **Usage**까지 스크롤
2. **Identity Provider Metadata** URL 복사:
   ```
   https://YOUR_AUTH0_DOMAIN/samlp/metadata/YOUR_CLIENT_ID
   ```
   - `YOUR_AUTH0_DOMAIN`: Auth0 테넌트 도메인
   - `YOUR_CLIENT_ID`: 생성한 애플리케이션의 Client ID

3. 이 URL 저장 - AWS IAM Identity Center 구성에 필요

또는 메타데이터 URL을 방문하여 XML을 직접 다운로드.

### 5. 이 애플리케이션에 GitHub 연결 활성화

1. 애플리케이션 설정(메인 페이지, 애드온 아님)으로 돌아가기
2. **Connections** 탭 클릭
3. **Social**에서 **GitHub** 활성화
4. 사용하지 않을 다른 연결 비활성화

### 6. 애플리케이션 설정 구성

1. **Settings** 탭에서:
   - **Allowed Callback URLs**: AWS IAM Identity Center ACS URL 추가
   - **Allowed Logout URLs**: AWS IAM Identity Center 도메인 추가
   - **Allowed Web Origins**: AWS IAM Identity Center 도메인 추가

2. **Advanced Settings** → **OAuth**에서:
   - 문제 발생 시 **OIDC Conformant** 비활성화

3. **Save Changes** 클릭

## 3단계 완료 후 업데이트

AWS IAM Identity Center 구성(3단계) 완료 후 AWS에서 SAML 메타데이터를 다운로드하여 다음 값을 업데이트해야 합니다:

1. **Application Callback URL**: 메타데이터의 `AssertionConsumerService Location` 값으로 변경
2. **Settings JSON**:
   - `audience`: 메타데이터의 `entityID` 값으로 변경
   - `destination`: 메타데이터의 `AssertionConsumerService Location` 값으로 변경
3. **Allowed Callback URLs**: ACS URL로 업데이트

## SAML 어설션 예제

구성 후 Auth0는 다음과 같은 SAML 어설션을 생성합니다:

```xml
<saml:Assertion>
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">
      github|12345678
    </saml:NameID>
  </saml:Subject>
  <saml:AttributeStatement>
    <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress">
      <saml:AttributeValue>user@example.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name">
      <saml:AttributeValue>John Doe</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="https://aws.amazon.com/SAML/Attributes/RoleSessionName">
      <saml:AttributeValue>johndoe</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

## 문제 해결

### "Invalid SAML Response" 오류

- ACS URL이 정확히 일치하는지 확인
- 서명 알고리즘이 `rsa-sha256`인지 확인
- SAML 응답이 서명되어 있는지 확인 (`signResponse: true`)

### 속성 누락

- Settings JSON의 속성 매핑 확인
- 사용자 프로필에 필요한 속성이 있는지 확인
- Auth0 Rules/Actions를 통해 커스텀 클레임 추가 필요할 수 있음

### 시간 동기화 문제

- 모든 서버의 시간이 동기화되어 있는지 확인 (NTP)
- 필요시 `lifetimeInSeconds` 조정 (기본값: 3600)

## 다음 단계

[3단계: AWS IAM Identity Center 구성](03-aws-identity-center.md)으로 진행

> **리마인더**: 3단계 완료 후 이 문서의 "3단계 완료 후 업데이트" 섹션을 참조하여 설정을 업데이트하세요.
