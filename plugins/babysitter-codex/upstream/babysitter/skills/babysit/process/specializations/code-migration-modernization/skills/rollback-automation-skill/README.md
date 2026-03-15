# Rollback Automation Skill

## Overview

The Rollback Automation skill prepares and executes rollback procedures. It manages snapshots, generates scripts, and automates verification for safe migration rollback.

## Quick Start

### Prerequisites

- Snapshot storage
- Rollback tool access
- Verification scripts

### Basic Usage

1. **Create snapshot**
   - Capture current state
   - Store checkpoint
   - Document version

2. **Generate rollback scripts**
   - Database reverse migration
   - Application rollback
   - Config restoration

3. **Test rollback**
   - Execute in staging
   - Verify functionality
   - Measure timing

## Features

### Snapshot Components

| Component | Capture | Restore |
|-----------|---------|---------|
| Database | Schema + Data | Migration down |
| Application | Version/Config | Redeploy |
| Infrastructure | IaC state | Terraform apply |
| Traffic | Routing rules | Rule update |

### Rollback Triggers

- Error rate threshold
- Latency threshold
- Manual trigger
- Health check failure

## Configuration

```json
{
  "snapshot": {
    "storage": "s3://rollback-snapshots",
    "retention": "7d",
    "components": ["database", "config", "infrastructure"]
  },
  "triggers": {
    "errorRate": 5,
    "latencyP99": 2000,
    "healthCheckFailures": 3
  },
  "verification": {
    "smokeTests": "./tests/smoke.js",
    "dataChecks": "./tests/data-validation.sql"
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
