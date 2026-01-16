# AWS Auth with Auth0 Federation

This repository provides configuration and documentation for setting up Auth0 as a federated identity provider between GitHub and AWS IAM Identity Center (formerly AWS SSO).

## Architecture

```
GitHub → Auth0 (Social Connection) → Auth0 (SAML IdP) → AWS IAM Identity Center → AWS Accounts
```

Auth0 acts as an intermediary identity provider that:
1. Authenticates users via GitHub OAuth
2. Provides SAML assertions to AWS IAM Identity Center
3. Maps GitHub user attributes to AWS IAM Identity Center attributes

## Prerequisites

- Auth0 account (free tier works)
- GitHub account/organization
- AWS account with IAM Identity Center enabled
- AWS permissions to configure IAM Identity Center

## Quick Start

1. [Set up GitHub connection in Auth0](docs/01-github-connection.md)
2. [Configure SAML application in Auth0](docs/02-auth0-saml-config.md)
3. [Configure AWS IAM Identity Center](docs/03-aws-identity-center.md)
4. [Set up attribute mappings](docs/04-attribute-mappings.md)
5. [Test the integration](docs/05-testing.md)

## Directory Structure

```
.
├── docs/                           # Step-by-step setup documentation
│   ├── 01-github-connection.md     # GitHub OAuth setup in Auth0
│   ├── 02-auth0-saml-config.md     # Auth0 SAML application
│   ├── 03-aws-identity-center.md   # AWS IAM Identity Center config
│   ├── 04-attribute-mappings.md    # User attribute mappings
│   └── 05-testing.md               # Testing the flow
├── terraform/                      # Infrastructure as Code (optional)
│   ├── auth0/                      # Auth0 Terraform configs
│   └── aws/                        # AWS IAM Identity Center configs
└── examples/                       # Configuration examples
    ├── auth0-rules.js              # Auth0 Rules for attribute mapping
    └── saml-metadata.xml           # Example SAML metadata
```

## Features

- **Centralized Authentication**: Single sign-on across AWS accounts via GitHub credentials
- **No Custom Application Required**: Pure configuration, no code to maintain
- **GitHub as Identity Source**: Leverage existing GitHub organization membership
- **Flexible Attribute Mapping**: Map GitHub user/org data to AWS attributes
- **Multi-Account Access**: Control access to multiple AWS accounts from one place

## Configuration Overview

### 1. Auth0 Social Connection (GitHub)

- Connection Type: GitHub (OAuth2)
- Scopes: `user:email`, `read:org`
- Enabled attributes: email, name, username, organizations

### 2. Auth0 SAML Application

- Application Type: Regular Web Application (SAML)
- SAML Protocol: SAML 2.0
- Signature Algorithm: RSA-SHA256
- Enabled Connections: GitHub

### 3. AWS IAM Identity Center

- Identity Source: External Identity Provider (SAML)
- IdP Metadata: From Auth0 SAML application
- Attribute Mappings: Email, Name, Groups (from GitHub orgs/teams)

## User Flow

1. User navigates to AWS IAM Identity Center portal
2. Redirected to Auth0 login page
3. Clicks "Login with GitHub"
4. Authenticates with GitHub (if not already authenticated)
5. GitHub returns user profile to Auth0
6. Auth0 creates SAML assertion with mapped attributes
7. User redirected back to AWS with SAML assertion
8. AWS IAM Identity Center creates/updates user session
9. User accesses AWS accounts based on permission sets

## Attribute Mapping Examples

| GitHub Attribute | Auth0 Claim | AWS IAM Identity Center Attribute |
|-----------------|-------------|-----------------------------------|
| email | email | email |
| name | name | name |
| login (username) | nickname | userName |
| organizations | groups | groups (for permission set assignment) |

## Security Considerations

- Enable MFA in GitHub for additional security
- Use Auth0 Rules to enforce GitHub organization membership
- Configure session timeouts appropriately
- Review and audit AWS IAM Identity Center permission sets regularly
- Use GitHub teams for fine-grained access control

## Cost

- **Auth0**: Free tier supports up to 7,000 active users
- **AWS IAM Identity Center**: No additional cost (included with AWS account)
- **GitHub**: Existing GitHub account/organization

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md) for common issues and solutions.

## Additional Resources

- [Auth0 SAML Configuration](https://auth0.com/docs/protocols/saml-protocol)
- [AWS IAM Identity Center SAML Setup](https://docs.aws.amazon.com/singlesignon/latest/userguide/samlfederationconcept.html)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)

## License

MIT