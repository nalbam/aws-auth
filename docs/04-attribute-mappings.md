# 4단계: 속성 매핑 설정

이 가이드에서는 접근 제어를 위한 그룹/팀 매핑을 포함하여 GitHub 사용자 속성을 Auth0를 통해 AWS IAM Identity Center로 매핑하는 방법을 설명합니다.

## 개요

속성 흐름:

```
GitHub 프로필 → Auth0 사용자 프로필 → SAML 속성 → AWS IAM Identity Center 속성
```

## 기본 속성 매핑

2단계의 Auth0 SAML 설정에서 구성됨:

| GitHub 속성 | Auth0 사용자 속성 | SAML 속성 | AWS 속성 |
|------------|------------------|-----------|----------|
| email | email | emailaddress | email |
| name | name | name | name |
| login | nickname | RoleSessionName | userName |

## 고급: 그룹 매핑

권한 할당을 위해 GitHub 조직과 팀을 AWS IAM Identity Center 그룹에 매핑하려면:

### 1. 그룹 매핑을 위한 Auth0 Action 생성

1. Auth0 Dashboard에서 **Actions** → **Library**로 이동
2. **Build Custom** 클릭 (또는 **Flows** → **Login** 사용)
3. `Add GitHub Groups to SAML`이라는 새 Action 생성

```javascript
/**
 * PostLogin 흐름 실행 중 호출되는 핸들러.
 *
 * @param {Event} event - 로그인 중인 사용자와 컨텍스트에 대한 세부정보.
 * @param {PostLoginAPI} api - 로그인 동작을 변경하는 메서드를 가진 인터페이스.
 */
exports.onExecutePostLogin = async (event, api) => {
  // SAML 클라이언트(AWS)에 대해서만 처리
  if (event.client.name !== 'AWS IAM Identity Center') {
    return;
  }

  // GitHub ID에서 사용자의 조직 가져오기
  const orgs = event.user.identities
    ?.find(id => id.provider === 'github')
    ?.profileData?.organizations || [];

  // 조직 이름을 그룹으로 매핑
  const groups = orgs.map(org => `github:${org.login}`);

  // 팀 기반 접근의 경우 여기서 팀을 가져옴
  // 이는 GitHub에 대한 추가 API 호출이 필요
  // 예: groups.push(`github:org-name/team-name`);

  // SAML 어설션에 그룹 추가
  if (groups.length > 0) {
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/Groups',
      groups
    );
  }

  // 선택사항: 조직 메타데이터 추가
  api.samlResponse.setAttribute(
    'https://aws.amazon.com/SAML/Attributes/PrincipalTag:GitHubOrgs',
    groups.join(',')
  );
};
```

4. **Deploy** 클릭

### 2. Login Flow에 Action 추가

1. **Actions** → **Flows** → **Login**으로 이동
2. `Add GitHub Groups to SAML` Action을 플로우로 드래그
3. **Apply** 클릭

### 3. 그룹을 수신하도록 AWS 구성

3단계의 AWS IAM Identity Center 속성 매핑에 추가:

| Attributes (SAML) | Maps to (IAM Identity Center) |
|-------------------|-------------------------------|
| `https://aws.amazon.com/SAML/Attributes/Groups` | groups |

### 4. AWS IAM Identity Center에서 그룹 생성 (선택사항)

JIT 프로비저닝은 사용자를 생성할 수 있지만, 그룹은 일반적으로 미리 생성해야 합니다:

1. IAM Identity Center에서 **Groups**로 이동
2. GitHub 조직과 일치하는 그룹 생성:
   - `github:your-org-name`
   - `github:another-org`
3. 이 그룹을 권한 세트와 AWS 계정에 할당

## 향상된 기능: 팀 기반 접근 제어

GitHub 팀 멤버십을 포함하려면 GitHub API를 통해 팀을 가져와야 합니다:

### 1. GitHub Personal Access Token 생성

1. GitHub에서 Settings → Developer settings → Personal access tokens → Tokens (classic)으로 이동
2. 다음 스코프로 새 토큰 생성:
   - `read:org`
   - `read:team`
3. 토큰 복사

### 2. Auth0에 토큰 저장

1. Auth0 Dashboard에서 **Settings** → **Custom**으로 이동
2. 시크릿 추가:
   - Key: `GITHUB_ACCESS_TOKEN`
   - Value: GitHub 토큰

### 3. 팀 가져오기가 포함된 향상된 Action

```javascript
const axios = require('axios');

exports.onExecutePostLogin = async (event, api) => {
  if (event.client.name !== 'AWS IAM Identity Center') {
    return;
  }

  const githubIdentity = event.user.identities?.find(id => id.provider === 'github');
  if (!githubIdentity) {
    return;
  }

  const githubUsername = githubIdentity.profileData.login;
  const groups = [];

  // 조직 추가
  const orgs = githubIdentity.profileData.organizations || [];
  orgs.forEach(org => groups.push(`github:${org.login}`));

  // GitHub API를 사용하여 팀 멤버십 가져오기
  try {
    const token = event.secrets.GITHUB_ACCESS_TOKEN;

    for (const org of orgs) {
      const teamsResponse = await axios.get(
        `https://api.github.com/orgs/${org.login}/teams`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const teams = teamsResponse.data || [];

      // 각 팀의 멤버십 확인
      for (const team of teams) {
        try {
          await axios.get(
            `https://api.github.com/orgs/${org.login}/teams/${team.slug}/memberships/${githubUsername}`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );
          // 오류가 없으면 사용자가 멤버임
          groups.push(`github:${org.login}/${team.slug}`);
        } catch (err) {
          // 사용자가 이 팀의 멤버가 아님, 건너뛰기
        }
      }
    }
  } catch (error) {
    console.error('팀 가져오기 오류:', error.message);
  }

  // SAML 어설션에 그룹 추가
  if (groups.length > 0) {
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/Groups',
      groups
    );
  }
};
```

### 4. 의존성 설치

1. Action 편집기에서 **Dependencies** 클릭
2. 추가:
   - `axios`: `latest`

## 조직 제한

특정 GitHub 조직에 대한 접근 제한:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const ALLOWED_ORGS = ['your-org-name', 'another-org'];

  const githubIdentity = event.user.identities?.find(id => id.provider === 'github');
  const orgs = githubIdentity?.profileData?.organizations || [];
  const orgNames = orgs.map(org => org.login);

  const hasAllowedOrg = orgNames.some(org => ALLOWED_ORGS.includes(org));

  if (!hasAllowedOrg) {
    api.access.deny('승인된 GitHub 조직의 멤버여야 합니다');
  }
};
```

## 속성 매핑 테스트

### 1. SAML 어설션 내용 테스트

1. Auth0 Dashboard에서 Applications → AWS IAM Identity Center로 이동
2. **Addons** → **SAML2 Web App** → **Debug**로 이동
3. **Test**를 클릭하여 생성된 SAML 어설션 확인
4. 속성과 그룹이 있는지 확인

### 2. AWS 로그인 테스트

1. AWS 사용자 포털을 통해 로그인
2. 성공적으로 로그인 후 IAM Identity Center → Users로 이동
3. 사용자를 찾아 클릭
4. **Group memberships** 확인 - GitHub 기반 그룹이 표시되어야 함

### 3. CloudTrail 로그

SAML 어설션 세부정보를 위해 AWS CloudTrail 확인:

1. CloudTrail 콘솔로 이동
2. 이벤트 이름 필터: `AssumeRoleWithSAML`
3. 이벤트 세부정보를 보고 수신된 SAML 속성 확인

## 문제 해결

### AWS에 그룹이 나타나지 않음

- Action이 배포되고 Login 플로우에 추가되었는지 확인
- Auth0에서 Action 로그에 오류가 있는지 확인
- AWS에서 그룹에 대한 속성 매핑 확인
- IAM Identity Center에 그룹이 미리 생성되어 있는지 확인 (필요한 경우)

### GitHub API 속도 제한

- GitHub API는 속도 제한이 있음 (인증된 요청의 경우 시간당 5,000건)
- 팀 멤버십 캐싱 고려
- 실시간 가져오기 대신 웹훅 기반 업데이트 사용

### 조직/팀 누락

- GitHub OAuth 스코프에 `read:org`가 포함되어 있는지 확인
- 사용자가 GitHub에서 조직 접근을 승인해야 함
- 비공개 조직은 명시적 승인 필요

## 다음 단계

[5단계: 테스트](05-testing.md)로 진행
