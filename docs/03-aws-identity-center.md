# Step 3: Configure AWS IAM Identity Center

This guide walks you through configuring AWS IAM Identity Center (formerly AWS SSO) to use Auth0 as an external SAML identity provider.

## Prerequisites

- AWS account with IAM Identity Center enabled
- Admin access to AWS IAM Identity Center
- Auth0 SAML metadata URL from Step 2

## Steps

### 1. Enable IAM Identity Center

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com)
2. Navigate to **IAM Identity Center** (search for "IAM Identity Center" or "SSO")
3. If not already enabled, click **Enable** to activate IAM Identity Center
4. Select a region (this will be your home region)
5. Choose **Enable with AWS Organizations** or **Enable** (standalone)

### 2. Change Identity Source to External IdP

1. In IAM Identity Center, go to **Settings**
2. Under **Identity source**, click **Actions** → **Change identity source**
3. Select **External identity provider**
4. Click **Next**

### 3. Configure SAML 2.0 Settings

You'll need to provide two things:

#### A. IdP SAML Metadata

**Option 1: Upload metadata file**
1. Download the metadata from Auth0:
   ```
   https://YOUR_AUTH0_DOMAIN/samlp/metadata?connection=github
   ```
2. Save as `auth0-metadata.xml`
3. Upload the file

**Option 2: Enter metadata URL**
1. Enter the Auth0 metadata URL:
   ```
   https://YOUR_AUTH0_DOMAIN/samlp/metadata?connection=github
   ```

#### B. Service Provider Metadata

AWS will display Service Provider metadata. You need to copy values from this and update Auth0:

1. **AWS sign-in URL**: Copy the ACS URL (e.g., `https://YOUR_REGION.signin.aws.amazon.com/saml`)
2. **AWS audience URI**: Usually `https://signin.aws.amazon.com/saml`
3. **AWS IdP entity ID**: Copy this value

**Update Auth0 SAML Settings:**
- Go back to Auth0 Dashboard → Applications → AWS IAM Identity Center → Addons → SAML2 Web App
- Update the Settings JSON with the correct `destination` and `audience` from AWS
- Click **Save**

4. Click **Next** in AWS console

### 4. Configure Attribute Mappings

Map SAML attributes from Auth0 to AWS IAM Identity Center attributes:

| Subject (SAML) | Maps to (IAM Identity Center) |
|----------------|-------------------------------|
| `${user.email}` | Subject (required) |

| Attributes (SAML) | Maps to (IAM Identity Center) |
|-------------------|-------------------------------|
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | email (required) |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` | name |
| `https://aws.amazon.com/SAML/Attributes/RoleSessionName` | userName |

**Note**: The attribute names must exactly match what Auth0 sends in the SAML assertion.

5. Click **Review and confirm**
6. Type **ACCEPT** to confirm the change
7. Click **Change identity source**

### 5. Verify Identity Source

1. Wait for the identity source change to complete (may take a few minutes)
2. Go to **Settings** → **Identity source**
3. Status should show as **External identity provider (SAML 2.0)**

### 6. Configure User Access to AWS Accounts

#### Create Permission Sets

1. In IAM Identity Center, go to **Permission sets**
2. Click **Create permission set**
3. Choose a predefined set (e.g., **AdministratorAccess**, **ViewOnlyAccess**) or create custom
4. Name it (e.g., `AdminAccess`)
5. Set session duration
6. Click **Create**

#### Assign Users to AWS Accounts

1. Go to **AWS accounts**
2. Select an AWS account
3. Click **Assign users or groups**
4. Click **Next: Permission sets**

**Important**: Since you're using external IdP, users don't exist in IAM Identity Center yet. They will be created on first login.

For now, you can:
- Wait for users to log in (JIT provisioning)
- Or manually create users with matching email addresses

### 7. Get User Portal URL

1. Go to **Dashboard** in IAM Identity Center
2. Copy the **User portal URL** (e.g., `https://d-xxxxxxxxxx.awsapps.com/start`)
3. Share this URL with your users - this is where they'll log in

## Testing Initial Configuration

1. Open the User Portal URL in an incognito/private browser window
2. You should be redirected to Auth0
3. Click "Login with GitHub"
4. Authenticate with GitHub
5. You should be redirected back to AWS
6. First login will create your user in IAM Identity Center

## User Provisioning

AWS IAM Identity Center supports Just-In-Time (JIT) provisioning with external IdPs:

- User accounts are created automatically on first login
- User attributes are updated from SAML assertions on each login
- Users are identified by the NameID (subject) in SAML assertion

### Important Notes

- **User deletion**: Users are not automatically deleted when removed from GitHub
- **Attribute updates**: User attributes update on each login
- **Group membership**: Requires additional configuration (see Step 4)

## Troubleshooting

### "Invalid SAML Response" Error

- Verify metadata is correctly configured in both Auth0 and AWS
- Check that callback URLs match exactly
- Ensure SAML response is signed

### User Not Provisioned

- Check that email in SAML assertion matches exactly
- Verify attribute mappings are correct
- Look at CloudTrail logs for SAML errors

### Cannot Access AWS Accounts

- User must be assigned to permission sets
- Verify permission sets are attached to AWS accounts
- Check that user has logged in at least once (for JIT provisioning)

### Clock Skew Errors

- Ensure Auth0 and AWS systems have synchronized time
- Check `NotBefore` and `NotOnOrAfter` in SAML assertion
- Adjust session duration if needed

## Next Steps

Proceed to [Step 4: Set up Attribute Mappings](04-attribute-mappings.md)
