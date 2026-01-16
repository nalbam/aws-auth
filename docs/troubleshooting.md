# 문제 해결 가이드

Auth0 + GitHub + AWS IAM Identity Center 통합에 대한 일반적인 문제와 해결책입니다.

## 인증 문제

### 오류: "Invalid SAML Response"

**증상:**
- Auth0 리다이렉트 후 AWS에서 "Invalid SAML Response" 오류 표시

**가능한 원인:**
1. Auth0와 AWS 간 메타데이터 불일치
2. 잘못된 콜백 URL
3. 시스템 간 시간 동기화 문제
4. 잘못된 서명

**해결책:**

```bash
# 1. 메타데이터 일치 확인
# Auth0에서: SAML 애드온에서 메타데이터 다운로드
# AWS에서: 구성된 IdP 메타데이터와 비교

# 2. 콜백 URL 확인
# Auth0 SAML 설정에 다음이 있어야 함:
# - destination: https://YOUR_REGION.signin.aws.amazon.com/saml
# AWS에 일치하는 ACS URL이 있어야 함

# 3. 서명 설정 확인
# Auth0 SAML 설정에 다음이 있어야 함:
{
  "signatureAlgorithm": "rsa-sha256",
  "digestAlgorithm": "sha256",
  "signResponse": true
}
```

### 오류: GitHub에서 "Access Denied"

**증상:**
- GitHub OAuth 승인 실패
- GitHub에서 "Access denied" 메시지

**해결책:**

1. **OAuth App 상태 확인**
   - GitHub에서 OAuth 앱이 일시 중지되지 않았는지 확인
   - 조직 접근이 부여되었는지 확인

2. **콜백 URL 확인**
   ```
   예상: https://YOUR_AUTH0_DOMAIN/login/callback
   ```

3. **조직 접근 확인**
   - GitHub Settings → Applications → Authorized OAuth Apps
   - Auth0 애플리케이션 찾기
   - 조직 접근이 부여되었는지 확인

### 리다이렉트 루프

**증상:**
- 사용자가 Auth0와 AWS 사이를 반복적으로 이동
- 로그인 완료 안됨

**해결책:**

1. **브라우저 쿠키 및 캐시 삭제**
2. **콜백 URL이 정확히 일치하는지 확인**
3. **SAML 설정 확인:**
   ```json
   {
     "nameIdentifierFormat": "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
     "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
   }
   ```

## 사용자 프로비저닝 문제

### AWS에 사용자가 생성되지 않음

**증상:**
- 로그인 성공하지만 IAM Identity Center에 사용자 없음
- "No applications available" 메시지

**해결책:**

1. **SAML 어설션 확인**
   - Auth0 SAML 디버거를 사용하여 어설션 확인
   - NameID가 존재하고 유효한지 확인
   - 이메일 속성이 포함되어 있는지 확인

2. **AWS 속성 매핑 확인**
   ```
   필수 매핑:
   Subject → Subject (구성 필요)
   emailaddress → email (구성 필요)
   ```

3. **CloudTrail 로그 확인**
   ```bash
   # AssumeRoleWithSAML 이벤트 찾기
   # 이벤트 세부정보에서 오류 메시지 확인
   ```

### 사용자 속성이 업데이트되지 않음

**증상:**
- 사용자가 존재하지만 정보가 오래됨
- 이름 또는 이메일이 GitHub 프로필과 일치하지 않음

**해결책:**

1. **Auth0에서 프로필 동기화 활성화:**
   - GitHub 연결 설정으로 이동
   - "Sync user profile attributes at each login" 활성화

2. **강제 재로그인:**
   - AWS에서 로그아웃
   - 브라우저 세션 삭제
   - 다시 로그인

3. **Auth0 SAML 설정에서 속성 매핑 확인**

## 그룹 및 권한 문제

### AWS에 그룹이 나타나지 않음

**증상:**
- 사용자 생성되었지만 그룹 할당 안됨
- 예상된 그룹 누락

**해결책:**

1. **Auth0 Action이 배포되었는지 확인:**
   - Actions → Flows → Login으로 이동
   - Action이 플로우에 있는지 확인
   - Action 로그에서 오류 확인

2. **SAML 어설션에 그룹이 포함되어 있는지 확인:**
   ```bash
   # Auth0 SAML 디버거 사용
   # 속성 찾기:
   # https://aws.amazon.com/SAML/Attributes/Groups
   ```

3. **AWS 속성 매핑 확인:**
   ```
   Groups 속성이 "groups"에 매핑되어야 함
   ```

4. **AWS에서 그룹 수동 생성:**
   - IAM Identity Center → Groups
   - SAML의 이름과 일치하는 그룹 생성
   - 그룹은 SAML에서 자동 생성되지 않음

### AWS 계정에 접근할 수 없음

**증상:**
- 사용자에게 "No applications available" 표시
- AWS 계정이 포털에 나열되지 않음

**해결책:**

1. **사용자를 권한 세트에 할당:**
   ```bash
   # IAM Identity Center에서:
   # 1. AWS accounts로 이동
   # 2. 계정 선택
   # 3. Assign users or groups
   # 4. 사용자/그룹 선택
   # 5. 권한 세트 선택
   ```

2. **전파 대기:**
   - 변경 사항이 반영되는 데 몇 분 소요될 수 있음
   - 로그아웃 후 다시 로그인

3. **권한 세트 존재 확인:**
   - Permission sets 섹션 확인
   - 최소 하나의 권한 세트가 생성되어 있는지 확인

## GitHub 통합 문제

### GitHub 조직 누락

**증상:**
- 예상된 조직이 사용자 프로필에 없음
- 그룹이 올바르게 채워지지 않음

**해결책:**

1. **OAuth 스코프 확인:**
   - Auth0 → Authentication → Social → GitHub
   - `read:org` 스코프가 활성화되어 있는지 확인

2. **조직 승인 확인:**
   - GitHub Settings → Applications → Authorized OAuth Apps
   - Auth0 앱 찾기
   - 조직 접근 부여

3. **조직 승인 요청:**
   - 일부 조직은 OAuth 앱에 대한 관리자 승인 필요
   - GitHub 조직 관리자에게 문의

### GitHub API 속도 제한

**증상:**
- 간헐적 실패
- 로그에 "API rate limit exceeded"

**해결책:**

1. **인증된 GitHub API 호출 사용:**
   ```javascript
   // Auth0 Action에서 저장된 토큰 사용
   const token = event.secrets.GITHUB_ACCESS_TOKEN;
   headers: { 'Authorization': `Bearer ${token}` }
   ```

2. **캐싱 구현:**
   - 팀 멤버십 캐시
   - 업무 시간 중 짧은 TTL 사용

3. **속도 제한 모니터링:**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/rate_limit
   ```

## SAML 관련 문제

### 시간 동기화 오류

**증상:**
- "SAML assertion expired" 오류
- "NotBefore" 또는 "NotOnOrAfter" 검증 실패

**해결책:**

1. **시스템 시간 동기화 확인:**
   ```bash
   # 모든 시스템에서 NTP 확인
   # Auth0는 자동으로 동기화된 시간 사용
   ```

2. **SAML 수명 조정:**
   ```json
   {
     "lifetimeInSeconds": 3600
   }
   ```

3. **AWS 세션 기간 확인:**
   - IAM Identity Center → Settings
   - 세션 기간 설정 확인

### SAML 속성 누락

**증상:**
- 사용자 프로비저닝되었지만 데이터 누락
- AWS 사용자 프로필에 빈 필드

**해결책:**

1. **Auth0 사용자 프로필에 데이터가 있는지 확인:**
   - Auth0 → User Management → Users
   - 사용자 찾기, 프로필 확인

2. **SAML 매핑 확인:**
   ```json
   {
     "mappings": {
       "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
       "name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
     }
   }
   ```

3. **Auth0 Action을 사용하여 커스텀 속성 추가:**
   ```javascript
   api.samlResponse.setAttribute('customAttribute', value);
   ```

## 디버깅 도구

### Auth0 로그

```bash
# 실시간 로그 스트리밍
# 이동: Auth0 Dashboard → Monitoring → Logs

# 필터:
# - Event Type: Failed Login (f), Success Login (s)
# - Client: AWS IAM Identity Center
# - Connection: github
```

### SAML Tracer

SAML 디버깅을 위한 브라우저 확장:

1. SAML Tracer 설치 (Firefox/Chrome)
2. 로그인 전에 열기
3. 로그인 수행
4. SAML Request와 Response 검토

### AWS CloudTrail

```bash
# 이벤트 필터
Event name: AssumeRoleWithSAML
User name: <이메일/사용자명>

# 다음에서 오류 확인:
# - eventName: AssumeRoleWithSAML
# - errorCode 필드
# - errorMessage 필드
```

### SAML 어설션 테스트

```bash
# Auth0 Dashboard에서:
# Applications → AWS IAM Identity Center → Addons → SAML2 Web App
# Debug 섹션으로 스크롤
# "Test with the SAML Debugger" 클릭

# 확인:
# - NameID 존재
# - 모든 필수 속성 존재
# - 서명 유효
# - 시간 제약 유효
```

## 비상 절차

### Federation 우회 (비상 접근)

Federation이 중단되어 AWS 접근이 필요한 경우:

1. **AWS root 계정 사용** (사용 가능한 경우)
2. **IAM 사용자 사용** (미리 생성된 경우)
3. **비상 절차:**
   - MFA가 있는 비상 IAM 사용자 미리 생성
   - 비상 시에만 사용
   - 모든 사용 문서화

### ID 소스 롤백

AWS IAM Identity Center를 되돌려야 하는 경우:

1. IAM Identity Center → Settings로 이동
2. Actions → Change identity source
3. "Identity Center directory" 선택
4. 변경 확인

**경고:** 이 작업은:
- 외부 IdP 연결 해제
- 기존 사용자에 영향을 줄 수 있음
- 수동 사용자 재생성 필요할 수 있음

## 도움 받기

### Auth0 지원

- 커뮤니티: https://community.auth0.com
- 문서: https://auth0.com/docs
- 지원 티켓: https://support.auth0.com (유료 플랜)

### AWS 지원

- 문서: https://docs.aws.amazon.com/singlesignon/
- 지원 티켓: AWS Console → Support

### GitHub 지원

- 문서: https://docs.github.com
- 지원: https://support.github.com

## 모니터링 권장사항

다음에 대한 알림 설정:

1. **로그인 실패** (Auth0)
2. **SAML 어설션 실패** (CloudTrail)
3. **GitHub API 속도 제한 접근** (팀 동기화 사용 시)
4. **비정상적인 로그인 패턴** (Auth0 Anomaly Detection)

## 정기 유지보수

월간 작업:

- [ ] 오류에 대한 Auth0 로그 검토
- [ ] AWS IAM Identity Center 사용자 및 그룹 감사
- [ ] GitHub 조직 멤버십 검토
- [ ] Auth0 SDK/애드온 업데이트 확인
- [ ] 백업 인증 방법 작동 확인
- [ ] 재해 복구 절차 테스트
- [ ] 문서 검토 및 업데이트
