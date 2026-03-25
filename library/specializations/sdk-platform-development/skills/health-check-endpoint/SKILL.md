---
name: health-check-endpoint
description: Implement health check and readiness endpoints for SDK consumers
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Health Check Endpoint Skill

## Overview

This skill implements health check and readiness endpoints that SDK consumers can use to verify connectivity and dependency health, especially important for Kubernetes and load balancer integration.

## Capabilities

- Design health check contracts and responses
- Implement dependency checks (database, cache, external APIs)
- Support Kubernetes liveness and readiness probes
- Generate health status reports
- Configure degraded state handling
- Implement cascading health checks
- Support custom health indicators
- Configure health aggregation strategies

## Target Processes

- Observability Integration
- Platform API Gateway Design
- SDK Architecture Design

## Integration Points

- Kubernetes probe endpoints
- Load balancer health checks
- Monitoring systems
- Service mesh health
- Circuit breaker status

## Input Requirements

- Dependencies to check
- Health check intervals
- Timeout configurations
- Degradation policies
- Kubernetes probe requirements

## Output Artifacts

- Health check endpoint implementation
- Dependency check modules
- Health response schemas
- Kubernetes probe configurations
- Monitoring integrations
- Health aggregation logic

## Usage Example

```yaml
skill:
  name: health-check-endpoint
  context:
    endpoints:
      health: /health
      ready: /ready
      live: /live
    checks:
      - name: database
        type: tcp
        critical: true
      - name: cache
        type: redis
        critical: false
      - name: externalApi
        type: http
        url: https://api.example.com/health
    kubernetes:
      livenessProbe:
        path: /live
        periodSeconds: 10
      readinessProbe:
        path: /ready
        periodSeconds: 5
```

## Best Practices

1. Separate liveness from readiness
2. Make health checks fast
3. Include dependency status
4. Support graceful degradation
5. Avoid expensive checks in liveness
6. Cache health check results appropriately
