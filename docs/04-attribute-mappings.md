# Step 4: Set up Attribute Mappings

This guide explains how to map GitHub user attributes through Auth0 to AWS IAM Identity Center, including group/team mappings for access control.

## Overview

The attribute flow is:

```
GitHub Profile → Auth0 User Profile → SAML Attributes → AWS IAM Identity Center Attributes
```

## Basic Attribute Mappings

These are configured in Auth0 SAML settings (from Step 2):

| GitHub Attribute | Auth0 User Attribute | SAML Attribute | AWS Attribute |
|-----------------|---------------------|----------------|---------------|
| email | email | emailaddress | email |
| name | name | name | name |
| login | nickname | RoleSessionName | userName |

## Advanced: Group Mappings

To map GitHub organizations and teams to AWS IAM Identity Center groups for permission assignment:

### 1. Create Auth0 Action for Group Mapping

1. In Auth0 Dashboard, go to **Actions** → **Library**
2. Click **Build Custom** (or use **Flows** → **Login**)
3. Create a new Action named `Add GitHub Groups to SAML`

```javascript
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Only process for SAML clients (AWS)
  if (event.client.name !== 'AWS IAM Identity Center') {
    return;
  }

  // Get user's organizations from GitHub identity
  const orgs = event.user.identities
    ?.find(id => id.provider === 'github')
    ?.profileData?.organizations || [];

  // Map organization names to groups
  const groups = orgs.map(org => `github:${org.login}`);

  // For team-based access, you would fetch teams here
  // This requires additional API calls to GitHub
  // Example: groups.push(`github:org-name/team-name`);

  // Add groups to SAML assertion
  if (groups.length > 0) {
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/Groups',
      groups
    );
  }

  // Optional: Add organization metadata
  api.samlResponse.setAttribute(
    'https://aws.amazon.com/SAML/Attributes/PrincipalTag:GitHubOrgs',
    groups.join(',')
  );
};
```

4. Click **Deploy**

### 2. Add Action to Login Flow

1. Go to **Actions** → **Flows** → **Login**
2. Drag the `Add GitHub Groups to SAML` action to the flow
3. Click **Apply**

### 3. Configure AWS to Receive Groups

In AWS IAM Identity Center attribute mappings (from Step 3), add:

| Attributes (SAML) | Maps to (IAM Identity Center) |
|-------------------|-------------------------------|
| `https://aws.amazon.com/SAML/Attributes/Groups` | groups |

### 4. Create Groups in AWS IAM Identity Center (Optional)

While JIT provisioning can create users, groups typically need to be pre-created:

1. In IAM Identity Center, go to **Groups**
2. Create groups matching your GitHub organizations:
   - `github:your-org-name`
   - `github:another-org`
3. Assign these groups to permission sets and AWS accounts

## Enhanced: Team-Based Access Control

To include GitHub team membership, you need to fetch teams via GitHub API:

### 1. Create GitHub Personal Access Token

1. In GitHub, go to Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes:
   - `read:org`
   - `read:team`
3. Copy the token

### 2. Store Token in Auth0

1. In Auth0 Dashboard, go to **Settings** → **Custom**
2. Add a secret:
   - Key: `GITHUB_ACCESS_TOKEN`
   - Value: Your GitHub token

### 3. Enhanced Action with Team Fetching

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

  // Add organizations
  const orgs = githubIdentity.profileData.organizations || [];
  orgs.forEach(org => groups.push(`github:${org.login}`));

  // Fetch team memberships using GitHub API
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
      
      // Check each team for membership
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
          // If no error, user is a member
          groups.push(`github:${org.login}/${team.slug}`);
        } catch (err) {
          // User not a member of this team, skip
        }
      }
    }
  } catch (error) {
    console.error('Error fetching teams:', error.message);
  }

  // Add groups to SAML assertion
  if (groups.length > 0) {
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/Groups',
      groups
    );
  }
};
```

### 4. Install Dependencies

1. In the Action editor, click **Dependencies**
2. Add:
   - `axios`: `latest`

## Organization Enforcement

To restrict access to specific GitHub organizations:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const ALLOWED_ORGS = ['your-org-name', 'another-org'];
  
  const githubIdentity = event.user.identities?.find(id => id.provider === 'github');
  const orgs = githubIdentity?.profileData?.organizations || [];
  const orgNames = orgs.map(org => org.login);
  
  const hasAllowedOrg = orgNames.some(org => ALLOWED_ORGS.includes(org));
  
  if (!hasAllowedOrg) {
    api.access.deny('You must be a member of an authorized GitHub organization');
  }
};
```

## Testing Attribute Mappings

### 1. Test SAML Assertion Content

1. In Auth0 Dashboard, go to Applications → AWS IAM Identity Center
2. Go to **Addons** → **SAML2 Web App** → **Debug**
3. Click **Test** to see the generated SAML assertion
4. Verify attributes and groups are present

### 2. Test AWS Login

1. Log in via AWS User Portal
2. After successful login, go to IAM Identity Center → Users
3. Find your user and click on it
4. Check **Group memberships** - should show GitHub-based groups

### 3. CloudTrail Logs

Check AWS CloudTrail for SAML assertion details:

1. Go to CloudTrail console
2. Filter event name: `AssumeRoleWithSAML`
3. View event details to see SAML attributes received

## Troubleshooting

### Groups Not Appearing in AWS

- Verify Action is deployed and added to Login flow
- Check Action logs in Auth0 for errors
- Confirm attribute mapping for groups in AWS
- Ensure groups are pre-created in IAM Identity Center (if required)

### GitHub API Rate Limits

- GitHub API has rate limits (5,000 requests/hour for authenticated requests)
- Consider caching team memberships
- Use webhook-based updates instead of real-time fetching

### Missing Organizations/Teams

- Verify GitHub OAuth scopes include `read:org`
- User must authorize organization access in GitHub
- Private organizations require explicit authorization

## Next Steps

Proceed to [Step 5: Testing](05-testing.md)
