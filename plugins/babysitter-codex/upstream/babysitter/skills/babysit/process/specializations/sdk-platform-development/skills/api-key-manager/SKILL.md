---
name: api-key-manager
description: API key generation, rotation, and management system
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# API Key Manager Skill

## Overview

This skill implements comprehensive API key management including secure generation, rotation policies, usage tracking, and quota enforcement.

## Capabilities

- Generate cryptographically secure API keys
- Implement key rotation with grace periods
- Track key usage and enforce quotas
- Support key scoping and permissions
- Configure key prefix patterns for identification
- Implement key revocation and blacklisting
- Support multiple key types (test, live)
- Generate key hashes for secure storage

## Target Processes

- Authentication and Authorization Patterns
- Developer Portal Implementation
- Platform API Gateway Design

## Integration Points

- Key management systems (HashiCorp Vault)
- Rate limiting middleware
- Usage analytics systems
- Developer portal UIs
- API gateway key validation

## Input Requirements

- Key format requirements
- Scoping/permission model
- Rotation policy
- Quota definitions
- Storage security requirements

## Output Artifacts

- Key generation service
- Key validation middleware
- Rotation management system
- Usage tracking integration
- Quota enforcement rules
- Admin management API

## Usage Example

```yaml
skill:
  name: api-key-manager
  context:
    keyFormat:
      prefix: "sk_"
      testPrefix: "sk_test_"
      livePrefix: "sk_live_"
      length: 32
    rotation:
      enabled: true
      gracePeriod: "7d"
    scopes:
      - read
      - write
      - delete
    quotas:
      default: 1000
      premium: 10000
```

## Best Practices

1. Use cryptographically secure random generation
2. Prefix keys to indicate type (test/live)
3. Store only hashed keys in database
4. Implement rotation with overlap periods
5. Track usage per key for analytics
6. Support immediate revocation
