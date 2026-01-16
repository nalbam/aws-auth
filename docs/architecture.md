# Architecture Diagram

## Authentication Flow

```
┌──────────────┐
│              │
│   End User   │
│              │
└──────┬───────┘
       │ 1. Access AWS Portal
       │
       v
┌──────────────────────────────────┐
│                                  │
│   AWS IAM Identity Center        │
│   (User Portal)                  │
│                                  │
└──────────┬───────────────────────┘
           │ 2. Redirect to Auth0
           │    (SAML SSO)
           v
┌──────────────────────────────────┐
│                                  │
│         Auth0 (IdP)              │
│   - SAML Identity Provider       │
│   - GitHub Connection            │
│                                  │
└──────────┬───────────────────────┘
           │ 3. Login with GitHub
           │
           v
┌──────────────────────────────────┐
│                                  │
│         GitHub OAuth             │
│   - User Authentication          │
│   - Organization Data            │
│                                  │
└──────────┬───────────────────────┘
           │ 4. Return user profile
           │    (email, orgs, teams)
           v
┌──────────────────────────────────┐
│         Auth0 (IdP)              │
│   - Transform to SAML            │
│   - Add group claims             │
│   - Sign assertion               │
└──────────┬───────────────────────┘
           │ 5. SAML Response
           │
           v
┌──────────────────────────────────┐
│   AWS IAM Identity Center        │
│   - Validate SAML                │
│   - Create/update user (JIT)     │
│   - Assign groups                │
└──────────┬───────────────────────┘
           │ 6. Grant access
           │
           v
┌──────────────────────────────────┐
│                                  │
│      AWS Accounts                │
│   - AssumeRole via SSO           │
│   - Based on Permission Sets     │
│                                  │
└──────────────────────────────────┘
```

## Data Flow

### User Attributes Mapping

```
GitHub Profile              Auth0 User Profile         SAML Assertion                 AWS User
├── email               →   email                  →   emailaddress              →   email
├── name                →   name                   →   name                      →   name
├── login (username)    →   nickname               →   RoleSessionName           →   userName
└── organizations[]     →   custom mapping         →   Groups[]                  →   groups[]
```

### Group/Team Mapping Example

```
GitHub Organization         Auth0 Action              SAML Group                    AWS IAM Identity Center
└── my-company          →   Transform             →   github:my-company         →   Group: github:my-company
    ├── Team: admins    →   GitHub API call       →   github:my-company/admins  →   Group: github:my-company/admins
    └── Team: devs      →   GitHub API call       →   github:my-company/devs    →   Group: github:my-company/devs
```

## Permission Model

```
┌─────────────────────────────────────────────────────────┐
│                   AWS Organization                      │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────┐  │
│  │ Account: Prod │  │ Account: Dev  │  │Account:...│  │
│  └───────┬───────┘  └───────┬───────┘  └─────┬─────┘  │
│          │                  │                │         │
└──────────┼──────────────────┼────────────────┼─────────┘
           │                  │                │
           │                  │                │
    ┌──────▼──────────────────▼────────────────▼──────┐
    │      IAM Identity Center Permission Sets        │
    │  ┌─────────────┐  ┌──────────┐  ┌──────────┐   │
    │  │AdminAccess  │  │DevAccess │  │ReadOnly  │   │
    │  └──────┬──────┘  └─────┬────┘  └────┬─────┘   │
    └─────────┼───────────────┼────────────┼──────────┘
              │               │            │
       ┌──────▼───────────────▼────────────▼──────┐
       │         Group Assignments                │
       │  ┌───────────────────────────────────┐   │
       │  │ github:my-company/admins          │   │
       │  │   → AdminAccess on Prod, Dev      │   │
       │  ├───────────────────────────────────┤   │
       │  │ github:my-company/devs            │   │
       │  │   → DevAccess on Dev              │   │
       │  ├───────────────────────────────────┤   │
       │  │ github:my-company                 │   │
       │  │   → ReadOnly on all accounts      │   │
       │  └───────────────────────────────────┘   │
       └──────────────────────────────────────────┘
```

## Components

### Auth0 Configuration
- **Social Connection**: GitHub OAuth
- **SAML Application**: AWS IAM Identity Center
- **Action/Rule**: Group mapping logic
- **Users**: Synced from GitHub

### AWS IAM Identity Center
- **Identity Source**: External (SAML 2.0)
- **Permission Sets**: Define AWS permissions
- **Users**: JIT provisioned from SAML
- **Groups**: Mapped from GitHub orgs/teams
- **Assignments**: Link groups to permission sets + accounts

### GitHub
- **OAuth App**: Authenticates users
- **Organizations**: Used for group membership
- **Teams**: Optional fine-grained access control
- **User Attributes**: Provided to Auth0

## Security Layers

```
┌──────────────────────────────────────────────┐
│ Layer 1: GitHub Authentication               │
│  - MFA (if enabled)                          │
│  - GitHub username/password or SSO           │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│ Layer 2: GitHub Authorization                │
│  - Organization membership                   │
│  - OAuth scope approval                      │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│ Layer 3: Auth0 Policies                      │
│  - Organization restrictions                 │
│  - Custom rules/actions                      │
│  - Rate limiting                             │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│ Layer 4: SAML Assertion Validation           │
│  - Signature verification                    │
│  - Time-based validation                     │
│  - Audience check                            │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│ Layer 5: AWS IAM Identity Center             │
│  - Group-based access control                │
│  - Permission set policies                   │
│  - Account-level restrictions                │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│ Layer 6: AWS IAM Permissions                 │
│  - Service-level permissions                 │
│  - Resource-level permissions                │
│  - Condition-based access                    │
└──────────────────────────────────────────────┘
```
