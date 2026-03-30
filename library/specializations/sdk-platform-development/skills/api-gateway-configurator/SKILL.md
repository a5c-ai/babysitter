---
name: api-gateway-configurator
description: Configure API gateways for SDK traffic management
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# API Gateway Configurator Skill

## Overview

This skill configures API gateways to manage SDK traffic including routing, authentication, rate limiting, and circuit breakers for reliable API delivery.

## Capabilities

- Configure request routing and load balancing
- Implement rate limiting and throttling
- Set up authentication and authorization
- Configure circuit breakers for resilience
- Implement request/response transformation
- Set up API versioning routes
- Configure caching policies
- Implement CORS and security headers

## Target Processes

- Platform API Gateway Design
- API Versioning Strategy
- Authentication and Authorization Patterns

## Integration Points

- Kong Gateway
- AWS API Gateway
- Apigee
- Azure API Management
- Envoy/Istio

## Input Requirements

- Routing requirements
- Rate limiting policies
- Authentication methods
- Transformation needs
- Resilience requirements

## Output Artifacts

- Gateway configuration files
- Route definitions
- Rate limit policies
- Authentication plugins
- Circuit breaker configs
- Transformation rules

## Usage Example

```yaml
skill:
  name: api-gateway-configurator
  context:
    gateway: kong
    routes:
      - path: /v1/*
        upstream: api-v1
        plugins:
          - rate-limiting
          - jwt-auth
      - path: /v2/*
        upstream: api-v2
        plugins:
          - rate-limiting
          - oauth2
    rateLimiting:
      default: 1000/hour
      authenticated: 10000/hour
    circuitBreaker:
      threshold: 5
      timeout: 30s
```

## Best Practices

1. Use declarative configurations
2. Implement proper rate limiting tiers
3. Configure circuit breakers for all upstreams
4. Version APIs through routing
5. Centralize authentication
6. Monitor gateway metrics
