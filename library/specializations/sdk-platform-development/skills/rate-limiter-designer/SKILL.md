---
name: rate-limiter-designer
description: Design and implement rate limiting strategies
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Rate Limiter Designer Skill

## Overview

This skill designs and implements rate limiting strategies including token bucket, sliding window, and quota systems to protect APIs while providing fair access.

## Capabilities

- Implement token bucket and leaky bucket algorithms
- Configure per-key and per-user limits
- Design quota and usage systems
- Generate rate limit HTTP headers
- Implement distributed rate limiting
- Configure burst allowances
- Design rate limit tiers
- Handle rate limit exceeded responses

## Target Processes

- Platform API Gateway Design
- Authentication and Authorization Patterns
- Developer Portal Implementation

## Integration Points

- Redis for distributed state
- Rate limiting middleware
- API gateway plugins
- CDN rate limiting
- Database-backed quotas

## Input Requirements

- Rate limit requirements
- Tier definitions
- Burst allowances
- Distribution strategy
- Header conventions

## Output Artifacts

- Rate limiting implementation
- Quota management system
- Rate limit headers
- Tier configuration
- Admin management API
- Usage tracking

## Usage Example

```yaml
skill:
  name: rate-limiter-designer
  context:
    algorithm: sliding-window
    storage: redis
    tiers:
      - name: free
        requests: 100
        window: 1h
        burst: 10
      - name: pro
        requests: 10000
        window: 1h
        burst: 100
    headers:
      limit: X-RateLimit-Limit
      remaining: X-RateLimit-Remaining
      reset: X-RateLimit-Reset
    responses:
      exceeded:
        status: 429
        retryAfter: true
```

## Best Practices

1. Use sliding window for accuracy
2. Include burst allowances
3. Return standard rate limit headers
4. Provide clear Retry-After values
5. Implement distributed limiting
6. Design fair quota systems
