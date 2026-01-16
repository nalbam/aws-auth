# Troubleshooting Guide

Common issues and solutions for Auth0 + GitHub + AWS IAM Identity Center integration.

## Authentication Issues

### Error: "Invalid SAML Response"

**Symptoms:**
- AWS shows "Invalid SAML Response" error after Auth0 redirect

**Possible Causes:**
1. Metadata mismatch between Auth0 and AWS
2. Incorrect callback URL
3. Clock skew between systems
4. Invalid signature

**Solutions:**

```bash
# 1. Verify metadata matches
# In Auth0: Download metadata from SAML addon
# In AWS: Compare with configured IdP metadata

# 2. Check callback URLs
# Auth0 SAML settings should have:
# - destination: https://YOUR_REGION.signin.aws.amazon.com/saml
# AWS should have matching ACS URL

# 3. Verify signature settings
# Auth0 SAML settings should have:
{
  "signatureAlgorithm": "rsa-sha256",
  "digestAlgorithm": "sha256",
  "signResponse": true
}
```

### Error: "Access Denied" from GitHub

**Symptoms:**
- GitHub OAuth authorization fails
- "Access denied" message from GitHub

**Solutions:**

1. **Check OAuth App Status**
   - Verify OAuth app is not suspended in GitHub
   - Check organization access is granted

2. **Verify Callback URL**
   ```
   Expected: https://YOUR_AUTH0_DOMAIN/login/callback
   ```

3. **Check Organization Access**
   - GitHub Settings → Applications → Authorized OAuth Apps
   - Find Auth0 application
   - Verify organization access is granted

### Redirect Loop

**Symptoms:**
- User bounces between Auth0 and AWS repeatedly
- Never completes login

**Solutions:**

1. **Clear browser cookies and cache**
2. **Verify callback URLs match exactly**
3. **Check SAML settings:**
   ```json
   {
     "nameIdentifierFormat": "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
     "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
   }
   ```

## User Provisioning Issues

### User Not Created in AWS

**Symptoms:**
- Login succeeds but user not in IAM Identity Center
- "No applications available" message

**Solutions:**

1. **Check SAML Assertion**
   - Use Auth0 SAML debugger to verify assertion
   - Ensure NameID is present and valid
   - Verify email attribute is included

2. **Check AWS Attribute Mappings**
   ```
   Required mapping:
   Subject → Subject (must be configured)
   emailaddress → email (must be configured)
   ```

3. **Check CloudTrail Logs**
   ```bash
   # Look for AssumeRoleWithSAML events
   # Check for error messages in event details
   ```

### User Attributes Not Updated

**Symptoms:**
- User exists but has outdated information
- Name or email doesn't match GitHub profile

**Solutions:**

1. **Enable profile sync in Auth0:**
   - Go to GitHub connection settings
   - Enable "Sync user profile attributes at each login"

2. **Force re-login:**
   - Log out from AWS
   - Clear browser session
   - Log in again

3. **Check attribute mappings in Auth0 SAML settings**

## Group and Permission Issues

### Groups Not Appearing in AWS

**Symptoms:**
- User created but no groups assigned
- Expected groups missing

**Solutions:**

1. **Verify Auth0 Action is deployed:**
   - Go to Actions → Flows → Login
   - Check Action is present in flow
   - Check Action logs for errors

2. **Check SAML assertion includes groups:**
   ```bash
   # Use Auth0 SAML debugger
   # Look for attribute:
   # https://aws.amazon.com/SAML/Attributes/Groups
   ```

3. **Verify AWS attribute mapping:**
   ```
   Groups attribute must be mapped to "groups"
   ```

4. **Create groups manually in AWS:**
   - IAM Identity Center → Groups
   - Create group matching name from SAML
   - Groups are not auto-created from SAML

### Cannot Access AWS Accounts

**Symptoms:**
- User sees "No applications available"
- AWS accounts not listed in portal

**Solutions:**

1. **Assign user to permission set:**
   ```bash
   # In IAM Identity Center:
   # 1. Go to AWS accounts
   # 2. Select account
   # 3. Assign users or groups
   # 4. Select user/group
   # 5. Choose permission set
   ```

2. **Wait for propagation:**
   - Changes may take a few minutes
   - Log out and log back in

3. **Verify permission set exists:**
   - Check Permission sets section
   - Ensure at least one permission set is created

## GitHub Integration Issues

### Missing GitHub Organizations

**Symptoms:**
- Expected organizations not in user profile
- Groups not populated correctly

**Solutions:**

1. **Verify OAuth scopes:**
   - Auth0 → Authentication → Social → GitHub
   - Ensure `read:org` scope is enabled

2. **Check organization authorization:**
   - GitHub Settings → Applications → Authorized OAuth Apps
   - Find Auth0 app
   - Grant organization access

3. **Request organization approval:**
   - Some orgs require admin approval for OAuth apps
   - Contact GitHub organization admin

### GitHub API Rate Limits

**Symptoms:**
- Intermittent failures
- "API rate limit exceeded" in logs

**Solutions:**

1. **Use authenticated GitHub API calls:**
   ```javascript
   // In Auth0 Action, use stored token
   const token = event.secrets.GITHUB_ACCESS_TOKEN;
   headers: { 'Authorization': `token ${token}` }
   ```

2. **Implement caching:**
   - Cache team memberships
   - Use shorter TTL during business hours

3. **Monitor rate limit:**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/rate_limit
   ```

## SAML-Specific Issues

### Clock Skew Errors

**Symptoms:**
- "SAML assertion expired" error
- "NotBefore" or "NotOnOrAfter" validation failures

**Solutions:**

1. **Verify system time synchronization:**
   ```bash
   # Check NTP on all systems
   # Auth0 uses synchronized time automatically
   ```

2. **Adjust SAML lifetime:**
   ```json
   {
     "lifetimeInSeconds": 3600
   }
   ```

3. **Check AWS session duration:**
   - IAM Identity Center → Settings
   - Verify session duration setting

### Missing SAML Attributes

**Symptoms:**
- User provisioned but missing data
- Empty fields in AWS user profile

**Solutions:**

1. **Check Auth0 user profile has data:**
   - Auth0 → User Management → Users
   - Find user, check profile

2. **Verify SAML mappings:**
   ```json
   {
     "mappings": {
       "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
       "name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
     }
   }
   ```

3. **Use Auth0 Action to add custom attributes:**
   ```javascript
   api.samlResponse.setAttribute('customAttribute', value);
   ```

## Debugging Tools

### Auth0 Logs

```bash
# Real-time log streaming
# Go to: Auth0 Dashboard → Monitoring → Logs

# Filter by:
# - Event Type: Failed Login (f), Success Login (s)
# - Client: AWS IAM Identity Center
# - Connection: github
```

### SAML Tracer

Browser extension for debugging SAML:

1. Install SAML Tracer (Firefox/Chrome)
2. Open before logging in
3. Perform login
4. Review SAML Request and Response

### AWS CloudTrail

```bash
# Filter events
Event name: AssumeRoleWithSAML
User name: <your-email>

# Check for errors in:
# - eventName: AssumeRoleWithSAML
# - errorCode field
# - errorMessage field
```

### Test SAML Assertion

```bash
# In Auth0 Dashboard:
# Applications → AWS IAM Identity Center → Addons → SAML2 Web App
# Scroll to Debug section
# Click "Test with the SAML Debugger"

# Verify:
# - NameID present
# - All required attributes present
# - Signature valid
# - Time constraints valid
```

## Emergency Procedures

### Bypass Federation (Emergency Access)

If federation is broken and you need AWS access:

1. **Use AWS root account** (if available)
2. **Use IAM users** (if pre-created)
3. **Break glass procedure:**
   - Pre-create emergency IAM user with MFA
   - Use only in emergencies
   - Document all usage

### Rollback Identity Source

If you need to revert AWS IAM Identity Center:

1. Go to IAM Identity Center → Settings
2. Actions → Change identity source
3. Select "Identity Center directory"
4. Confirm change

**Warning:** This will:
- Disconnect external IdP
- May affect existing users
- Require manual user recreation

## Getting Help

### Auth0 Support

- Community: https://community.auth0.com
- Documentation: https://auth0.com/docs
- Support tickets: https://support.auth0.com (paid plans)

### AWS Support

- Documentation: https://docs.aws.amazon.com/singlesignon/
- Support tickets: AWS Console → Support

### GitHub Support

- Documentation: https://docs.github.com
- Support: https://support.github.com

## Monitoring Recommendations

Set up alerts for:

1. **Failed login attempts** (Auth0)
2. **SAML assertion failures** (CloudTrail)
3. **GitHub API rate limit approaching** (if using team sync)
4. **Unusual login patterns** (Auth0 Anomaly Detection)

## Regular Maintenance

Monthly tasks:

- [ ] Review Auth0 logs for errors
- [ ] Audit AWS IAM Identity Center users and groups
- [ ] Review GitHub organization memberships
- [ ] Check for Auth0 SDK/addon updates
- [ ] Verify backup authentication method works
- [ ] Test disaster recovery procedure
- [ ] Review and update documentation
