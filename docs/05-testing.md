# Step 5: Testing the Integration

This guide walks you through testing the complete GitHub → Auth0 → AWS IAM Identity Center federation flow.

## Pre-Testing Checklist

Before testing, ensure you have completed:

- ✅ GitHub connection configured in Auth0
- ✅ SAML application created in Auth0
- ✅ AWS IAM Identity Center configured with Auth0 as IdP
- ✅ Attribute mappings configured
- ✅ At least one permission set created in AWS
- ✅ User portal URL obtained from AWS IAM Identity Center

## Test 1: Basic Authentication Flow

### Step-by-Step Test

1. **Open AWS User Portal** (in incognito/private window to ensure fresh login)
   ```
   https://d-xxxxxxxxxx.awsapps.com/start
   ```

2. **Verify Redirect to Auth0**
   - You should be redirected to Auth0 login page
   - URL should be `https://YOUR_AUTH0_DOMAIN/...`

3. **Click "Login with GitHub"**
   - Should redirect to GitHub OAuth authorization
   - If already logged into GitHub, may skip directly to authorization

4. **Authorize Application**
   - GitHub will ask for permissions (first time only)
   - Review requested scopes (email, organizations)
   - Click **Authorize**

5. **Verify Redirect to AWS**
   - Should redirect back to AWS User Portal
   - May see brief loading screen

6. **Verify Successful Login**
   - Should see AWS User Portal with your name
   - May see message "No applications" if not yet assigned to any AWS accounts

### Expected Behavior

✅ **Success Indicators:**
- Smooth redirects through GitHub → Auth0 → AWS
- User portal displays your name from GitHub
- No error messages

❌ **Failure Indicators:**
- "Invalid SAML Response" error
- Stuck on Auth0 page
- "Access Denied" from GitHub
- Redirect loop

## Test 2: User Provisioning

Verify that your user was created in IAM Identity Center:

1. As an AWS admin, go to **IAM Identity Center** → **Users**
2. Find the newly created user (should match your GitHub email)
3. Click on the user to view details

**Verify:**
- ✅ Email matches GitHub email
- ✅ Name matches GitHub name
- ✅ Username is populated (from GitHub login)
- ✅ Status is "Active"

## Test 3: Attribute Mapping

Check that attributes are correctly mapped:

1. In IAM Identity Center, view the user details
2. Check **Attributes** section:

| Attribute | Expected Value | Source |
|-----------|---------------|--------|
| Email | Your GitHub email | GitHub profile |
| Name | Your GitHub name | GitHub profile |
| Username | Your GitHub username | GitHub login |

## Test 4: Group Membership

If you configured group mappings (from Step 4):

1. In IAM Identity Center, go to **Groups**
2. Verify groups exist (e.g., `github:your-org`)
3. Click on a group to view members
4. Verify your user is listed as a member

**Manual Test:**
1. Go to **Users** → Your user → **Group memberships**
2. Verify GitHub-based groups are listed

## Test 5: AWS Account Access

### Assign User to Permission Set

1. In IAM Identity Center, go to **AWS accounts**
2. Select an AWS account
3. Click **Assign users or groups**
4. Search for your user (or group)
5. Click **Next**
6. Select a permission set (e.g., `ReadOnlyAccess`)
7. Click **Submit**

### Test Access to AWS Account

1. Log out and log back in to AWS User Portal
2. You should now see AWS account(s) listed
3. Click on an AWS account
4. Select a role (based on permission set)
5. Click **Management console**

**Expected:**
- Opens AWS Management Console
- Top right shows your assumed role
- You have permissions based on permission set

## Test 6: SAML Assertion Inspection

For detailed debugging, inspect the SAML assertion:

### Using Browser Developer Tools

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Log in to AWS User Portal
4. Look for POST request to AWS SAML endpoint
5. Inspect **Form Data** → `SAMLResponse`
6. Decode the Base64 SAML response

### Using Auth0 SAML Debugger

1. In Auth0 Dashboard, go to **Applications** → AWS app
2. Go to **Addons** → **SAML2 Web App**
3. Scroll to **Debug**
4. Click **Test with the SAML Debugger**
5. Review the generated SAML assertion

**Verify:**
- ✅ NameID present (usually email)
- ✅ Required attributes: email, name
- ✅ Groups attribute (if configured)
- ✅ Valid signature
- ✅ NotBefore and NotOnOrAfter times are reasonable

## Test 7: End-to-End Workflow

Complete workflow test:

1. **Login**: Authenticate via GitHub
2. **Portal Access**: View AWS accounts in user portal
3. **Role Assumption**: Access AWS Management Console
4. **Permissions**: Verify you can perform allowed actions
5. **Session Duration**: Verify session timeout works as expected
6. **Logout**: Log out from AWS
7. **Re-login**: Verify can log back in successfully

## Test 8: Error Scenarios

Test error handling:

### Test Unauthorized User

1. Try to log in with a GitHub account that's NOT in allowed organizations
2. **Expected**: Access denied with appropriate message

### Test Expired Session

1. Log in successfully
2. Wait for session to expire (based on SAML lifetime setting)
3. Try to access AWS console
4. **Expected**: Prompted to re-authenticate

### Test Logout

1. Log in to AWS User Portal
2. Click **Sign out**
3. **Expected**: Logged out successfully, redirect to login page
4. Verify cannot access portal without re-authenticating

## Troubleshooting Tests

### Enable Auth0 Logging

1. Go to Auth0 Dashboard → **Monitoring** → **Logs**
2. Watch for authentication events during testing
3. Look for errors or warnings

Useful log event types:
- `s` - Success Login
- `f` - Failed Login
- `seacft` - Success Exchange (SAML)
- `feacft` - Failed Exchange (SAML)

### Enable AWS CloudTrail

1. Go to AWS CloudTrail console
2. Create a trail if not exists
3. Filter events:
   - Event name: `AssumeRoleWithSAML`
   - User name: Your email/username

4. Review event details for SAML-related errors

### Common Issues and Solutions

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| "Invalid SAML Response" | Metadata mismatch | Verify Auth0 and AWS metadata match |
| User not provisioned | Email mismatch | Check email in SAML assertion matches |
| No AWS accounts shown | Not assigned to permission set | Assign user/group to account+permission set |
| Groups not populated | Action not deployed | Verify Action is in Login flow |
| Clock skew error | Time synchronization | Check NTP on all systems |
| Redirect loop | Callback URL mismatch | Verify all callback URLs match exactly |

## Performance Testing

For production use:

1. **Concurrent Logins**: Test multiple users logging in simultaneously
2. **Session Management**: Verify sessions timeout appropriately
3. **Failover**: Test what happens if Auth0 is temporarily unavailable
4. **API Rate Limits**: Monitor GitHub API usage if using team fetching

## Security Testing

1. **Test MFA**: If GitHub MFA enabled, verify it's required
2. **Test Authorization**: Verify users can only access permitted AWS accounts
3. **Test Logout**: Ensure proper session cleanup on logout
4. **Test Token Expiry**: Verify tokens expire as configured

## Documentation for End Users

After successful testing, document for your users:

1. **Login URL**: AWS User Portal URL
2. **Login Process**: "Click Login with GitHub"
3. **Troubleshooting**: Common issues and contacts
4. **Account Access**: Which accounts they can access and why

## Next Steps

After successful testing:

1. ✅ Document the configuration
2. ✅ Set up monitoring and alerting
3. ✅ Create runbooks for common issues
4. ✅ Train support team
5. ✅ Communicate with end users
6. ✅ Plan for disaster recovery

See [troubleshooting.md](troubleshooting.md) for ongoing operational guidance.
