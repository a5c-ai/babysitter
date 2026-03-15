---
name: logging-migrator
description: Migrate logging infrastructure with format standardization, structured logging, and aggregation setup
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Logging Migrator Skill

Migrates logging infrastructure, handling log format standardization, structured logging conversion, and aggregation setup.

## Purpose

Enable logging modernization for:
- Log format standardization
- Structured logging conversion
- Log aggregation setup
- Correlation ID injection
- Retention policy migration

## Capabilities

### 1. Log Format Standardization
- Define standard format
- Convert existing logs
- Implement across services
- Validate compliance

### 2. Structured Logging Conversion
- Convert to JSON format
- Add metadata fields
- Handle custom fields
- Support multiple languages

### 3. Log Aggregation Setup
- Configure centralized logging
- Set up log shipping
- Handle high volume
- Implement failover

### 4. Correlation ID Injection
- Implement trace IDs
- Propagate across services
- Handle async operations
- Enable distributed tracing

### 5. Log Level Normalization
- Standardize log levels
- Map between frameworks
- Configure filtering
- Handle verbosity

### 6. Retention Policy Migration
- Define retention rules
- Implement rotation
- Handle archival
- Manage storage

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| ELK Stack | Log aggregation | Config |
| Datadog | Observability | API |
| Splunk | Log analysis | API |
| Loki | Log aggregation | Config |
| Fluentd | Log shipping | Config |

## Output Schema

```json
{
  "migrationId": "string",
  "timestamp": "ISO8601",
  "logging": {
    "format": "string",
    "aggregation": {
      "tool": "string",
      "endpoint": "string"
    },
    "retention": {
      "days": "number",
      "archival": "boolean"
    }
  },
  "services": [
    {
      "name": "string",
      "status": "migrated|pending",
      "logFormat": "string"
    }
  ]
}
```

## Integration with Migration Processes

- **logging-observability-migration**: Primary migration tool
- **cloud-migration**: Cloud logging setup

## Related Skills

- `performance-baseline-capturer`: Observability metrics

## Related Agents

- `observability-migration-agent`: Full observability
- `operational-readiness-agent`: Operations setup
