# 5단계: 통합 테스트

이 가이드에서는 GitHub → Auth0 → AWS IAM Identity Center 연동 흐름 전체를 테스트하는 방법을 안내합니다.

## 테스트 전 체크리스트

테스트 전에 다음을 완료했는지 확인:

- ✅ Auth0에 GitHub 연결 구성됨
- ✅ Auth0에 SAML 애플리케이션 생성됨
- ✅ Auth0를 IdP로 사용하도록 AWS IAM Identity Center 구성됨
- ✅ 속성 매핑 구성됨
- ✅ AWS에 최소 하나의 권한 세트 생성됨
- ✅ AWS IAM Identity Center에서 사용자 포털 URL 획득

## 테스트 1: 기본 인증 흐름

### 단계별 테스트

1. **AWS 사용자 포털 열기** (새로운 로그인을 위해 시크릿/프라이빗 창에서)
   ```
   https://d-xxxxxxxxxx.awsapps.com/start
   ```

2. **Auth0로 리다이렉트 확인**
   - Auth0 로그인 페이지로 리다이렉트되어야 함
   - URL이 `https://YOUR_AUTH0_DOMAIN/...`이어야 함

3. **"Login with GitHub" 클릭**
   - GitHub OAuth 승인으로 리다이렉트되어야 함
   - 이미 GitHub에 로그인되어 있으면 바로 승인으로 건너뛸 수 있음

4. **애플리케이션 승인**
   - GitHub이 권한 요청 (첫 번째만)
   - 요청된 스코프 검토 (이메일, 조직)
   - **Authorize** 클릭

5. **AWS로 리다이렉트 확인**
   - AWS 사용자 포털로 다시 리다이렉트되어야 함
   - 잠시 로딩 화면이 표시될 수 있음

6. **성공적인 로그인 확인**
   - AWS 사용자 포털에 이름이 표시되어야 함
   - AWS 계정에 아직 할당되지 않은 경우 "No applications" 메시지 표시될 수 있음

### 예상 동작

✅ **성공 지표:**
- GitHub → Auth0 → AWS를 통한 원활한 리다이렉트
- 사용자 포털에 GitHub의 이름 표시
- 오류 메시지 없음

❌ **실패 지표:**
- "Invalid SAML Response" 오류
- Auth0 페이지에서 멈춤
- GitHub에서 "Access Denied"
- 리다이렉트 루프

## 테스트 2: 사용자 프로비저닝

IAM Identity Center에 사용자가 생성되었는지 확인:

1. AWS 관리자로서 **IAM Identity Center** → **Users**로 이동
2. 새로 생성된 사용자 찾기 (GitHub 이메일과 일치해야 함)
3. 사용자를 클릭하여 세부정보 확인

**확인:**
- ✅ 이메일이 GitHub 이메일과 일치
- ✅ 이름이 GitHub 이름과 일치
- ✅ 사용자명이 채워져 있음 (GitHub 로그인에서)
- ✅ 상태가 "Active"

## 테스트 3: 속성 매핑

속성이 올바르게 매핑되었는지 확인:

1. IAM Identity Center에서 사용자 세부정보 확인
2. **Attributes** 섹션 확인:

| 속성 | 예상 값 | 소스 |
|-----|--------|------|
| Email | GitHub 이메일 | GitHub 프로필 |
| Name | GitHub 이름 | GitHub 프로필 |
| Username | GitHub 사용자명 | GitHub 로그인 |

## 테스트 4: 그룹 멤버십

그룹 매핑을 구성한 경우 (4단계에서):

1. IAM Identity Center에서 **Groups**로 이동
2. 그룹 존재 확인 (예: `github:your-org`)
3. 그룹을 클릭하여 멤버 확인
4. 사용자가 멤버로 나열되어 있는지 확인

**수동 테스트:**
1. **Users** → 사용자 → **Group memberships**로 이동
2. GitHub 기반 그룹이 나열되어 있는지 확인

## 테스트 5: AWS 계정 접근

### 사용자를 권한 세트에 할당

1. IAM Identity Center에서 **AWS accounts**로 이동
2. AWS 계정 선택
3. **Assign users or groups** 클릭
4. 사용자 (또는 그룹) 검색
5. **Next** 클릭
6. 권한 세트 선택 (예: `ReadOnlyAccess`)
7. **Submit** 클릭

### AWS 계정 접근 테스트

1. 로그아웃 후 AWS 사용자 포털에 다시 로그인
2. 이제 AWS 계정이 나열되어야 함
3. AWS 계정 클릭
4. 역할 선택 (권한 세트 기반)
5. **Management console** 클릭

**예상:**
- AWS Management Console 열림
- 오른쪽 상단에 가정된 역할 표시
- 권한 세트에 따른 권한 보유

## 테스트 6: SAML 어설션 검사

상세 디버깅을 위해 SAML 어설션 검사:

### 브라우저 개발자 도구 사용

1. 브라우저 DevTools 열기 (F12)
2. **Network** 탭으로 이동
3. AWS 사용자 포털에 로그인
4. AWS SAML 엔드포인트로의 POST 요청 찾기
5. **Form Data** → `SAMLResponse` 검사
6. Base64 SAML 응답 디코드

### Auth0 SAML 디버거 사용

1. Auth0 Dashboard에서 **Applications** → AWS 앱으로 이동
2. **Addons** → **SAML2 Web App**으로 이동
3. **Debug**까지 스크롤
4. **Test with the SAML Debugger** 클릭
5. 생성된 SAML 어설션 검토

**확인:**
- ✅ NameID 존재 (일반적으로 이메일)
- ✅ 필수 속성: email, name
- ✅ Groups 속성 (구성된 경우)
- ✅ 유효한 서명
- ✅ NotBefore와 NotOnOrAfter 시간이 합리적

## 테스트 7: 전체 워크플로우

완전한 워크플로우 테스트:

1. **로그인**: GitHub을 통해 인증
2. **포털 접근**: 사용자 포털에서 AWS 계정 확인
3. **역할 가정**: AWS Management Console 접근
4. **권한**: 허용된 작업 수행 가능 확인
5. **세션 기간**: 세션 타임아웃이 예상대로 작동하는지 확인
6. **로그아웃**: AWS에서 로그아웃
7. **재로그인**: 다시 성공적으로 로그인 가능한지 확인

## 테스트 8: 오류 시나리오

오류 처리 테스트:

### 권한 없는 사용자 테스트

1. 허용된 조직에 속하지 않은 GitHub 계정으로 로그인 시도
2. **예상**: 적절한 메시지와 함께 접근 거부

### 만료된 세션 테스트

1. 성공적으로 로그인
2. 세션 만료 대기 (SAML 수명 설정에 따라)
3. AWS 콘솔 접근 시도
4. **예상**: 재인증 요청

### 로그아웃 테스트

1. AWS 사용자 포털에 로그인
2. **Sign out** 클릭
3. **예상**: 성공적으로 로그아웃, 로그인 페이지로 리다이렉트
4. 재인증 없이 포털 접근 불가 확인

## 문제 해결 테스트

### Auth0 로깅 활성화

1. Auth0 Dashboard → **Monitoring** → **Logs**로 이동
2. 테스트 중 인증 이벤트 확인
3. 오류나 경고 찾기

유용한 로그 이벤트 유형:
- `s` - Success Login
- `f` - Failed Login
- `seacft` - Success Exchange (SAML)
- `feacft` - Failed Exchange (SAML)

### AWS CloudTrail 활성화

1. AWS CloudTrail 콘솔로 이동
2. 트레일이 없으면 생성
3. 이벤트 필터:
   - 이벤트 이름: `AssumeRoleWithSAML`
   - 사용자 이름: 이메일/사용자명

4. SAML 관련 오류에 대한 이벤트 세부정보 검토

### 일반적인 문제와 해결책

| 문제 | 가능한 원인 | 해결책 |
|-----|-----------|-------|
| "Invalid SAML Response" | 메타데이터 불일치 | Auth0와 AWS 메타데이터 일치 확인 |
| 사용자 프로비저닝 안됨 | 이메일 불일치 | SAML 어설션의 이메일 일치 확인 |
| AWS 계정 표시 안됨 | 권한 세트 미할당 | 사용자/그룹을 계정+권한 세트에 할당 |
| 그룹 채워지지 않음 | Action 미배포 | Action이 Login 플로우에 있는지 확인 |
| 시간 동기화 오류 | 시간 동기화 문제 | 모든 시스템에서 NTP 확인 |
| 리다이렉트 루프 | 콜백 URL 불일치 | 모든 콜백 URL이 정확히 일치하는지 확인 |

## 성능 테스트

프로덕션 사용을 위해:

1. **동시 로그인**: 여러 사용자 동시 로그인 테스트
2. **세션 관리**: 세션이 적절히 타임아웃되는지 확인
3. **장애 조치**: Auth0가 일시적으로 사용 불가능할 때 발생하는 상황 테스트
4. **API 속도 제한**: 팀 가져오기 사용 시 GitHub API 사용량 모니터링

## 보안 테스트

1. **MFA 테스트**: GitHub MFA 활성화 시 필수인지 확인
2. **권한 테스트**: 사용자가 허용된 AWS 계정에만 접근 가능한지 확인
3. **로그아웃 테스트**: 로그아웃 시 적절한 세션 정리 확인
4. **토큰 만료 테스트**: 토큰이 구성대로 만료되는지 확인

## 최종 사용자를 위한 문서

성공적인 테스트 후 사용자에게 문서화:

1. **로그인 URL**: AWS 사용자 포털 URL
2. **로그인 프로세스**: "Login with GitHub" 클릭
3. **문제 해결**: 일반적인 문제와 연락처
4. **계정 접근**: 접근 가능한 계정과 이유

## 다음 단계

성공적인 테스트 후:

1. ✅ 구성 문서화
2. ✅ 모니터링 및 알림 설정
3. ✅ 일반적인 문제에 대한 런북 생성
4. ✅ 지원 팀 교육
5. ✅ 최종 사용자에게 안내
6. ✅ 재해 복구 계획

지속적인 운영 가이드는 [troubleshooting.md](troubleshooting.md)를 참조하세요.
