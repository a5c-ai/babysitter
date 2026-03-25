---
name: oauth-flow-implementer
description: Implement OAuth 2.0 and OpenID Connect flows for SDKs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# OAuth Flow Implementer Skill

## Overview

This skill implements OAuth 2.0 and OpenID Connect authentication flows for SDKs, supporting various grant types and security best practices.

## Capabilities

- Implement authorization code flow with PKCE
- Configure client credentials flow for server-to-server
- Handle automatic token refresh transparently
- Support device authorization flow for CLI/IoT
- Implement implicit flow (legacy support)
- Configure token storage securely
- Handle token revocation and logout
- Support multiple OAuth providers

## Target Processes

- Authentication and Authorization Patterns
- Platform API Gateway Design
- SDK Architecture Design

## Integration Points

- OAuth 2.0 providers (Auth0, Okta, etc.)
- OpenID Connect providers
- Custom authorization servers
- Token storage mechanisms
- Secure credential storage

## Input Requirements

- OAuth provider configuration
- Required grant types
- Scope definitions
- Token storage requirements
- Refresh token strategy

## Output Artifacts

- OAuth client implementation
- Token management module
- PKCE implementation
- Secure storage integration
- Authentication middleware
- Example authentication flows

## Usage Example

```yaml
skill:
  name: oauth-flow-implementer
  context:
    provider: custom
    grantTypes:
      - authorization_code_pkce
      - client_credentials
      - device_code
    tokenStorage: secure-keychain
    autoRefresh: true
    scopes:
      - read
      - write
      - admin
```

## Best Practices

1. Always use PKCE for public clients
2. Store tokens securely (keychain, encrypted storage)
3. Implement automatic token refresh
4. Handle token expiration gracefully
5. Support token revocation
6. Log authentication events (not tokens)
