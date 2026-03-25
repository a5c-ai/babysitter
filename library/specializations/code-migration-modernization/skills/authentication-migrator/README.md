# Authentication Migrator Skill

## Overview

The Authentication Migrator skill modernizes authentication systems. It handles credential migration, OAuth2/OIDC setup, and identity provider integration.

## Quick Start

### Prerequisites

- Current auth system access
- Target IdP configured
- User data backup

### Basic Usage

1. **Analyze current auth**
   - Document auth mechanisms
   - Map user data
   - Inventory MFA

2. **Set up target IdP**
   - Configure OAuth2/OIDC
   - Set up federation
   - Test flows

3. **Migrate users**
   - Export user data
   - Transform credentials
   - Import to new system

## Features

### Migration Types

| Type | Description | Complexity |
|------|-------------|------------|
| Password | Hash migration | Medium |
| MFA | Device transfer | High |
| Sessions | Token conversion | Medium |
| Federation | IdP setup | High |

### Supported Providers

- Auth0
- Okta
- Keycloak
- AWS Cognito
- Azure AD B2C

## Configuration

```json
{
  "source": {
    "type": "custom",
    "database": "users_db",
    "hashAlgorithm": "bcrypt"
  },
  "target": {
    "type": "auth0",
    "tenant": "my-tenant",
    "connection": "Username-Password-Authentication"
  },
  "migration": {
    "batchSize": 1000,
    "validateLogins": true,
    "migrateMfa": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Auth0 User Migration](https://auth0.com/docs/users/user-migration)
