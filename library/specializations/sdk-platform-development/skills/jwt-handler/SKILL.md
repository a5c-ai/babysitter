---
name: jwt-handler
description: JWT creation, validation, and management for SDK authentication
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# JWT Handler Skill

## Overview

This skill implements JWT-based authentication for SDKs including token creation, validation, key rotation via JWKS, and secure claims handling.

## Capabilities

- Generate and validate JWTs with multiple algorithms
- Implement JWKS (JSON Web Key Set) key rotation
- Support multiple signing algorithms (RS256, ES256, EdDSA)
- Handle token claims validation and extraction
- Configure token expiration and refresh
- Implement audience and issuer validation
- Support nested JWTs and JWE encryption
- Handle clock skew tolerance

## Target Processes

- Authentication and Authorization Patterns
- SDK Architecture Design
- Platform API Gateway Design

## Integration Points

- jose libraries (node-jose, python-jose)
- JWKS endpoints for key distribution
- Identity providers
- Token introspection endpoints
- Key management systems

## Input Requirements

- Signing algorithm preference
- Claims schema requirements
- Key rotation strategy
- Validation requirements
- Token lifetime configuration

## Output Artifacts

- JWT generation module
- Token validation middleware
- JWKS endpoint implementation
- Claims extraction utilities
- Key rotation automation
- Token refresh handling

## Usage Example

```yaml
skill:
  name: jwt-handler
  context:
    algorithm: RS256
    issuer: "https://api.example.com"
    audience: "api-users"
    expiration: "1h"
    refreshExpiration: "7d"
    jwksEndpoint: "/.well-known/jwks.json"
    keyRotation:
      enabled: true
      period: "30d"
    claims:
      - sub
      - email
      - roles
```

## Best Practices

1. Use asymmetric algorithms for public validation
2. Implement key rotation via JWKS
3. Validate all standard claims (iss, aud, exp)
4. Handle clock skew appropriately
5. Keep token payloads minimal
6. Never store sensitive data in JWTs
