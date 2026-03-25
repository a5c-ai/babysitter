# Cloud Cost Estimator Skill

## Overview

The Cloud Cost Estimator skill projects cloud costs for migration. It provides sizing recommendations, identifies optimization opportunities, and compares TCO.

## Quick Start

### Prerequisites

- Current infrastructure details
- Target cloud provider
- Usage patterns

### Basic Usage

1. **Inventory resources**
   - List current servers
   - Document storage
   - Map network usage

2. **Estimate costs**
   ```bash
   # Using Infracost
   infracost breakdown --path=./terraform
   ```

3. **Optimize**
   - Right-size instances
   - Consider reserved capacity
   - Evaluate spot instances

## Features

### Cost Categories

| Category | Components | Variability |
|----------|------------|-------------|
| Compute | EC2, VMs | High |
| Storage | S3, EBS, Disks | Medium |
| Network | Data transfer | High |
| Database | RDS, Cloud SQL | Medium |

### Optimization Options

- Reserved Instances (1-3 year)
- Spot/Preemptible instances
- Right-sizing
- Auto-scaling

## Configuration

```json
{
  "target": {
    "cloud": "aws",
    "region": "us-east-1"
  },
  "resources": {
    "compute": [{
      "type": "ec2",
      "size": "m5.large",
      "count": 5
    }],
    "storage": [{
      "type": "s3",
      "sizeGB": 1000
    }]
  },
  "options": {
    "includeRI": true,
    "includeSpot": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [AWS Pricing Calculator](https://calculator.aws/)
- [Infracost](https://www.infracost.io/)
