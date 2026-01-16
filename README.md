# Auth0 Federation을 통한 AWS 인증

이 저장소는 GitHub과 AWS IAM Identity Center(구 AWS SSO) 간의 연동 ID 제공자로 Auth0를 설정하기 위한 구성 및 문서를 제공합니다.

## 아키텍처

```
GitHub → Auth0 (Social Connection) → Auth0 (SAML IdP) → AWS IAM Identity Center → AWS 계정
```

Auth0는 중간 ID 제공자로서 다음 역할을 수행합니다:
1. GitHub OAuth를 통한 사용자 인증
2. AWS IAM Identity Center에 SAML 어설션 제공
3. GitHub 사용자 속성을 AWS IAM Identity Center 속성으로 매핑

## 사전 요구사항

- Auth0 계정 (무료 티어 사용 가능)
- GitHub 계정/조직
- IAM Identity Center가 활성화된 AWS 계정
- IAM Identity Center 구성을 위한 AWS 권한

## 빠른 시작

1. [Auth0에서 GitHub 연결 설정](docs/01-github-connection.md)
2. [Auth0에서 SAML 애플리케이션 구성](docs/02-auth0-saml-config.md)
3. [AWS IAM Identity Center 구성](docs/03-aws-identity-center.md)
4. [속성 매핑 설정](docs/04-attribute-mappings.md)
5. [통합 테스트](docs/05-testing.md)

## 디렉토리 구조

```
.
├── docs/                              # 단계별 설정 문서
│   ├── 01-github-connection.md        # Auth0에서 GitHub OAuth 설정
│   ├── 02-auth0-saml-config.md        # Auth0 SAML 애플리케이션
│   ├── 03-aws-identity-center.md      # AWS IAM Identity Center 구성
│   ├── 04-attribute-mappings.md       # 사용자 속성 매핑
│   ├── 05-testing.md                  # 통합 테스트
│   ├── architecture.md                # 아키텍처 다이어그램
│   └── troubleshooting.md             # 문제 해결 가이드
├── terraform/                         # Infrastructure as Code (선택사항)
│   ├── auth0/                         # Auth0 Terraform 구성
│   │   ├── main.tf
│   │   ├── terraform.tfvars.example
│   │   └── actions/
│   │       └── github-groups.js       # GitHub 그룹 매핑 Action
│   └── aws/                           # AWS IAM Identity Center 구성
│       └── main.tf
└── examples/                          # 구성 예제
    ├── auth0-action.js                # 속성 매핑을 위한 Auth0 Action
    ├── auth0-saml-settings.json       # Auth0 SAML 설정 템플릿
    └── aws-identity-center-config.json # AWS IAM Identity Center 구성 템플릿
```

## 기능

- **중앙 집중식 인증**: GitHub 자격 증명을 통한 AWS 계정 간 Single Sign-On
- **커스텀 애플리케이션 불필요**: 순수 구성, 유지보수할 코드 없음
- **GitHub을 ID 소스로 활용**: 기존 GitHub 조직 멤버십 활용
- **유연한 속성 매핑**: GitHub 사용자/조직 데이터를 AWS 속성으로 매핑
- **다중 계정 접근**: 한 곳에서 여러 AWS 계정에 대한 접근 제어

## 구성 개요

### 1. Auth0 Social Connection (GitHub)

- 연결 유형: GitHub (OAuth2)
- 스코프: `user:email`, `read:org`
- 활성화된 속성: 이메일, 이름, 사용자명, 조직

### 2. Auth0 SAML 애플리케이션

- 애플리케이션 유형: Regular Web Application (SAML)
- SAML 프로토콜: SAML 2.0
- 서명 알고리즘: RSA-SHA256
- 활성화된 연결: GitHub

### 3. AWS IAM Identity Center

- ID 소스: 외부 ID 제공자 (SAML)
- IdP 메타데이터: Auth0 SAML 애플리케이션에서 가져옴
- 속성 매핑: 이메일, 이름, 그룹 (GitHub 조직/팀에서)

## 사용자 흐름

1. 사용자가 AWS IAM Identity Center 포털로 이동
2. Auth0 로그인 페이지로 리다이렉트
3. "Login with GitHub" 클릭
4. GitHub 인증 (이미 인증되지 않은 경우)
5. GitHub이 Auth0에 사용자 프로필 반환
6. Auth0가 매핑된 속성으로 SAML 어설션 생성
7. SAML 어설션과 함께 AWS로 사용자 리다이렉트
8. AWS IAM Identity Center가 사용자 세션 생성/업데이트
9. 사용자가 권한 세트에 따라 AWS 계정에 접근

## 속성 매핑 예제

| GitHub 속성 | Auth0 클레임 | AWS IAM Identity Center 속성 |
|------------|-------------|------------------------------|
| email | email | email |
| name | name | name |
| login (사용자명) | nickname | userName |
| organizations | groups | groups (권한 세트 할당용) |

## 보안 고려사항

- 추가 보안을 위해 GitHub에서 MFA 활성화
- Auth0 Rules를 사용하여 GitHub 조직 멤버십 강제
- 세션 타임아웃을 적절히 구성
- AWS IAM Identity Center 권한 세트를 정기적으로 검토 및 감사
- 세밀한 접근 제어를 위해 GitHub 팀 사용

## 비용

- **Auth0**: 무료 티어는 월 최대 7,500명의 활성 사용자 지원 (B2C 기준)
- **AWS IAM Identity Center**: 추가 비용 없음 (AWS 계정에 포함)
- **GitHub**: 기존 GitHub 계정/조직

## 문제 해결

일반적인 문제와 해결책은 [docs/troubleshooting.md](docs/troubleshooting.md)를 참조하세요.

## 추가 리소스

- [Auth0 SAML 구성](https://auth0.com/docs/protocols/saml-protocol)
- [AWS IAM Identity Center SAML 설정](https://docs.aws.amazon.com/singlesignon/latest/userguide/samlfederationconcept.html)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)

## 라이선스

MIT
