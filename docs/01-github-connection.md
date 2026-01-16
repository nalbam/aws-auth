# Step 1: Set up GitHub Connection in Auth0

This guide walks you through setting up GitHub as a social connection in Auth0.

## Prerequisites

- Auth0 account (sign up at [auth0.com](https://auth0.com))
- GitHub account or organization

## Steps

### 1. Create GitHub OAuth App (Optional - Auth0 can use default)

Auth0 provides a default GitHub OAuth app for testing, but for production, you should create your own:

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Fill in the details:
   - **Application name**: `Auth0 - AWS Federation`
   - **Homepage URL**: `https://YOUR_AUTH0_DOMAIN`
   - **Authorization callback URL**: `https://YOUR_AUTH0_DOMAIN/login/callback`
3. Click **Register application**
4. Note the **Client ID** and generate a **Client Secret**

### 2. Enable GitHub Connection in Auth0

1. Log in to the [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Authentication** → **Social**
3. Click on **GitHub**
4. Configure the connection:

   **If using your own GitHub OAuth App:**
   - Toggle **Use your own credentials**
   - Enter **Client ID** from GitHub
   - Enter **Client Secret** from GitHub

   **If using Auth0's default (for testing only):**
   - Leave default credentials

5. Click on **Permissions** tab
6. Enable the following scopes:
   - ✅ `user:email` (to get user email)
   - ✅ `read:org` (to get organization membership)
   - ✅ `read:user` (to get user profile)

7. Under **Attributes**, ensure these are enabled:
   - Email
   - Email Verified
   - Name
   - Username
   - Picture

### 3. Configure Connection Settings

1. In the **Settings** tab:
   - **Name**: Keep as `github`
   - **Sync user profile attributes at each login**: ✅ Enabled (recommended)

2. Click **Save Changes**

### 4. Test the Connection

1. In the GitHub connection page, click **Try Connection**
2. You should be redirected to GitHub for authentication
3. Authorize the application
4. You should see a success message with your user profile

## Advanced Configuration

### Organization Restrictions

To restrict access to specific GitHub organizations, you can add an Auth0 Rule (covered in Step 4).

### Team-Based Access

To map GitHub teams to AWS groups, you'll need to:
1. Request additional scopes if needed
2. Create an Auth0 Action/Rule to fetch team membership
3. Map teams to SAML groups attribute

## Troubleshooting

### "Access Denied" Error

- Check that your GitHub OAuth app callback URL matches exactly: `https://YOUR_AUTH0_DOMAIN/login/callback`
- Ensure the OAuth app is not suspended in GitHub

### Missing Email

- Verify `user:email` scope is enabled
- Check that the user has a public email in their GitHub profile
- If email is private, Auth0 might not be able to fetch it

### Missing Organizations

- Ensure `read:org` scope is enabled
- User must grant permission to access organization data
- Private organizations require explicit authorization

## Next Steps

Proceed to [Step 2: Configure SAML Application in Auth0](02-auth0-saml-config.md)
