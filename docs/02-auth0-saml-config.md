# 2단계: Auth0에서 SAML 애플리케이션 구성

이 가이드에서는 AWS IAM Identity Center의 ID 제공자(IdP)로 작동할 SAML 애플리케이션을 Auth0에서 생성하는 방법을 안내합니다.

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

```
https://YOUR_AWS_REGION.signin.aws.amazon.com/saml
```

`YOUR_AWS_REGION`을 AWS 리전으로 교체 (예: `us-east-1`, `eu-west-1`, `ap-northeast-2` 등).

AWS IAM Identity Center의 경우:
```
https://YOUR_IDENTITY_CENTER_DOMAIN.awsapps.com/start/saml2/acs
```

이 URL은 AWS IAM Identity Center에서 가져옵니다 (3단계에서 다룸).

#### Settings (JSON)

```json
{
  "audience": "https://signin.aws.amazon.com/saml",
  "mappings": {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    "nickname": "https://aws.amazon.com/SAML/Attributes/RoleSessionName"
  },
  "nameIdentifierFormat": "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
  "nameIdentifierProbes": [
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
  ],
  "signatureAlgorithm": "rsa-sha256",
  "digestAlgorithm": "sha256",
  "destination": "https://YOUR_IDENTITY_CENTER_DOMAIN.awsapps.com/start/saml2/acs",
  "lifetimeInSeconds": 3600,
  "signResponse": true,
  "includeAttributeNameFormat": true,
  "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
}
```

**중요**: `destination`을 실제 AWS IAM Identity Center 도메인으로 업데이트하세요.

4. **Enable**을 클릭한 후 **Save**

### 4. SAML 메타데이터 다운로드

1. SAML2 Web App 애드온 구성에서 **Usage**까지 스크롤
2. **Identity Provider Metadata** URL 복사 또는 다운로드:
   ```
   https://YOUR_AUTH0_DOMAIN/samlp/metadata?connection=YOUR_CONNECTION
   ```
3. 이 URL 저장 - AWS IAM Identity Center 구성에 필요

또는 메타데이터 URL을 방문하여 XML을 직접 다운로드.

### 5. 이 애플리케이션에 GitHub 연결 활성화

1. 애플리케이션 설정(메인 페이지, 애드온 아님)으로 돌아가기
2. **Connections** 탭 클릭
3. **Social**에서 **GitHub** 활성화
4. 사용하지 않을 다른 연결 비활성화

### 6. 애플리케이션 설정 구성

1. **Settings** 탭에서:
   - **Allowed Callback URLs**: AWS IAM Identity Center 콜백 URL 추가
   - **Allowed Logout URLs**: AWS IAM Identity Center 도메인 추가
   - **Allowed Web Origins**: AWS IAM Identity Center 도메인 추가

2. **Advanced Settings** → **OAuth**에서:
   - 문제 발생 시 **OIDC Conformant** 비활성화

3. **Save Changes** 클릭

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

- 콜백 URL이 정확히 일치하는지 확인
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
