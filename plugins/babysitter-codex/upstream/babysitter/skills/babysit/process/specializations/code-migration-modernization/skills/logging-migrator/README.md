# Logging Migrator Skill

## Overview

The Logging Migrator skill modernizes logging infrastructure. It standardizes log formats, implements structured logging, and sets up centralized aggregation.

## Quick Start

### Prerequisites

- Current logging inventory
- Target logging platform
- Service access

### Basic Usage

1. **Define standard format**
   ```json
   {
     "timestamp": "ISO8601",
     "level": "INFO",
     "service": "user-service",
     "traceId": "abc123",
     "message": "User logged in"
   }
   ```

2. **Configure aggregation**
   - Set up log shipping
   - Configure retention
   - Define indexes

3. **Migrate services**
   - Update logging config
   - Add correlation IDs
   - Verify in aggregator

## Features

### Log Format Standards

| Field | Purpose | Required |
|-------|---------|----------|
| timestamp | When | Yes |
| level | Severity | Yes |
| service | Source | Yes |
| traceId | Correlation | Yes |
| message | Content | Yes |

### Aggregation Platforms

- Elasticsearch (ELK)
- Datadog
- Splunk
- Grafana Loki
- AWS CloudWatch

## Configuration

```json
{
  "format": {
    "type": "json",
    "fields": {
      "timestamp": "@timestamp",
      "level": "log.level",
      "service": "service.name"
    }
  },
  "aggregation": {
    "type": "elasticsearch",
    "endpoint": "https://elk.example.com",
    "index": "logs-{service}-{date}"
  },
  "retention": {
    "hot": "7d",
    "warm": "30d",
    "cold": "90d"
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Elastic Common Schema](https://www.elastic.co/guide/en/ecs/current/)
