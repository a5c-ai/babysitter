---
name: authentication-migrator
description: Migrate authentication systems with credential migration, OAuth2/OIDC setup, and identity provider integration
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Authentication Migrator Skill

Migrates authentication systems, handling credential migration, session-to-token conversion, and identity provider integration.

## Purpose

Enable authentication modernization for:
- Credential migration
- Session to token conversion
- OAuth2/OIDC setup
- MFA migration
- Identity provider integration

## Capabilities

### 1. Credential Migration
- Extract user credentials
- Hash conversion
- Secure transfer
- Validation testing

### 2. Session to Token Conversion
- Migrate from sessions
- Implement JWT tokens
- Handle refresh tokens
- Manage token lifecycle

### 3. OAuth2/OIDC Setup
- Configure authorization server
- Set up flows
- Implement scopes
- Handle client credentials

### 4. MFA Migration
- Transfer MFA settings
- Support multiple methods
- Handle device registration
- Manage recovery codes

### 5. Identity Provider Integration
- Configure IdP connections
- Set up federation
- Handle SAML/OIDC
- Manage user sync

### 6. User Migration Scripts
- Generate migration scripts
- Handle data transformation
- Validate migration
- Support rollback

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Auth0 | Identity platform | API |
| Keycloak | Open source IdP | API/CLI |
| Okta | Identity management | API |
| AWS Cognito | AWS identity | CLI |
| Azure AD B2C | Azure identity | CLI |

## Output Schema

```json
{
  "migrationId": "string",
  "timestamp": "ISO8601",
  "users": {
    "total": "number",
    "migrated": "number",
    "failed": "number"
  },
  "credentials": {
    "passwords": "number",
    "mfaDevices": "number"
  },
  "configuration": {
    "oauth2": {},
    "idpConnections": []
  },
  "validation": {
    "loginTests": {},
    "tokenTests": {}
  }
}
```

## Integration with Migration Processes

- **authentication-modernization**: Primary migration tool

## Related Skills

- `compliance-validator`: Security compliance

## Related Agents

- `authentication-migration-agent`: Migration orchestration
