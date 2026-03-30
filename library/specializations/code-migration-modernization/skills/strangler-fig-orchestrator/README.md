# Strangler Fig Orchestrator Skill

## Overview

The Strangler Fig Orchestrator skill manages incremental migration using the strangler fig pattern. It handles traffic routing, feature flags, and gradual cutover from legacy to modern systems.

## Quick Start

### Prerequisites

- API gateway or routing layer
- Feature flag system
- Monitoring in place

### Basic Usage

1. **Setup routing**
   - Configure gateway rules
   - Define routing strategy
   - Set initial weights

2. **Migrate incrementally**
   - Start with low-risk endpoints
   - Shift traffic gradually
   - Monitor metrics

3. **Complete cutover**
   - Verify full migration
   - Sunset legacy
   - Clean up

## Features

### Routing Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| Percentage | Split by weight | General |
| Header-based | Route by header | Testing |
| User-based | Route by user | Canary |
| Path-based | Route by path | Gradual |

### Cutover Phases

1. Shadow (0% new)
2. Canary (5-10% new)
3. Partial (25-50% new)
4. Majority (75-90% new)
5. Complete (100% new)

## Configuration

```json
{
  "legacy": {
    "baseUrl": "http://legacy.internal",
    "endpoints": ["/api/users", "/api/orders"]
  },
  "modern": {
    "baseUrl": "http://new.internal",
    "endpoints": ["/api/users", "/api/orders"]
  },
  "routing": {
    "type": "weighted",
    "initialWeight": 10,
    "incrementStep": 10,
    "healthCheckInterval": "1m"
  },
  "rollback": {
    "errorThreshold": 5,
    "latencyThreshold": 2000
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Strangler Fig Pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)
