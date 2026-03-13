# Cloud Readiness Assessor Skill

## Overview

The Cloud Readiness Assessor skill evaluates applications for cloud migration. It classifies applications using the 6Rs methodology and assesses cloud-native compliance.

## Quick Start

### Prerequisites

- Application inventory
- Architecture documentation
- Dependency information

### Basic Usage

1. **Inventory applications**
   - List all applications
   - Document dependencies
   - Map infrastructure

2. **Assess readiness**
   - Evaluate each application
   - Classify using 6Rs
   - Identify blockers

3. **Plan migration**
   - Prioritize applications
   - Estimate costs
   - Create roadmap

## Features

### 6Rs Classification

| Strategy | Description | Effort |
|----------|-------------|--------|
| Rehost | Lift and shift | Low |
| Replatform | Lift and reshape | Medium |
| Repurchase | Replace with SaaS | Low |
| Refactor | Re-architect | High |
| Retire | Decommission | N/A |
| Retain | Keep on-premises | N/A |

### Assessment Criteria

- Cloud-native patterns
- Statelessness
- Twelve-factor compliance
- External dependencies

## Configuration

```json
{
  "assessment": {
    "scope": ["all-applications"],
    "targetCloud": "aws",
    "includeCosting": true
  },
  "criteria": {
    "twelveFactor": true,
    "containerReadiness": true,
    "dataResidency": "us-east-1"
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [AWS Migration Hub](https://aws.amazon.com/migration-hub/)
