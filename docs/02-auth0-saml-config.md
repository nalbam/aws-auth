# Step 2: Configure SAML Application in Auth0

This guide walks you through creating a SAML application in Auth0 that will act as the Identity Provider (IdP) for AWS IAM Identity Center.

## Steps

### 1. Create a New Application

1. In the [Auth0 Dashboard](https://manage.auth0.com), navigate to **Applications** → **Applications**
2. Click **Create Application**
3. Configure:
   - **Name**: `AWS IAM Identity Center`
   - **Application Type**: **Regular Web Application**
4. Click **Create**

### 2. Configure Application as SAML IdP

1. Go to the **Addons** tab
2. Enable **SAML2 Web App**
3. Click on **SAML2 Web App** to configure

### 3. Configure SAML Settings

In the SAML configuration dialog:

#### Application Callback URL

```
https://YOUR_AWS_REGION.signin.aws.amazon.com/saml
```

Replace `YOUR_AWS_REGION` with your AWS region (e.g., `us-east-1`, `eu-west-1`)

For AWS IAM Identity Center, use:
```
https://YOUR_IDENTITY_CENTER_DOMAIN.awsapps.com/start/saml2/acs
```

Get this URL from AWS IAM Identity Center (covered in Step 3).

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

**Important**: Update `destination` with your actual AWS IAM Identity Center domain.

4. Click **Enable** and then **Save**

### 4. Download SAML Metadata

1. In the SAML2 Web App addon configuration, scroll down to **Usage**
2. Copy or download the **Identity Provider Metadata** URL:
   ```
   https://YOUR_AUTH0_DOMAIN/samlp/metadata?connection=YOUR_CONNECTION
   ```
3. Save this URL - you'll need it for AWS IAM Identity Center configuration

Alternatively, download the XML directly by visiting the metadata URL.

### 5. Enable GitHub Connection for This Application

1. Go back to the Application settings (main page, not addon)
2. Click on the **Connections** tab
3. Under **Social**, enable **GitHub**
4. Disable any other connections you don't want to use

### 6. Configure Application Settings

1. In the **Settings** tab:
   - **Allowed Callback URLs**: Add the AWS IAM Identity Center callback URL
   - **Allowed Logout URLs**: Add your AWS IAM Identity Center domain
   - **Allowed Web Origins**: Add your AWS IAM Identity Center domain

2. Under **Advanced Settings** → **OAuth**:
   - Disable **OIDC Conformant** if you encounter issues

3. Click **Save Changes**

## SAML Assertion Example

After configuration, Auth0 will generate SAML assertions like this:

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

## Troubleshooting

### "Invalid SAML Response" Error

- Verify the callback URL matches exactly
- Check that the signature algorithm is `rsa-sha256`
- Ensure SAML response is signed (`signResponse: true`)

### Missing Attributes

- Check attribute mappings in Settings JSON
- Verify user profile has the required attributes
- May need to add custom claims via Auth0 Rules/Actions

### Clock Skew Issues

- Ensure all servers have synchronized time (NTP)
- Adjust `lifetimeInSeconds` if needed (default: 3600)

## Next Steps

Proceed to [Step 3: Configure AWS IAM Identity Center](03-aws-identity-center.md)
