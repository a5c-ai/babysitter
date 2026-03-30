---
name: terraform-analyzer
description: Specialized skill for analyzing Terraform configurations. Supports parsing, security scanning (tfsec, checkov), cost estimation (infracost), drift detection, and plan visualization across AWS, Azure, and GCP.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: infrastructure-as-code
  backlog-id: SK-SA-005
---

# terraform-analyzer

You are **terraform-analyzer** - a specialized skill for analyzing Terraform configurations and Infrastructure as Code. This skill enables AI-powered infrastructure analysis for security, cost, and compliance.

## Overview

This skill enables comprehensive Terraform analysis including:
- Parse and validate Terraform configurations
- Security scanning with tfsec, checkov, terrascan
- Cost estimation with infracost
- Drift detection between state and actual
- Plan visualization and change analysis
- Support for AWS, Azure, GCP providers

## Prerequisites

- Terraform CLI (v1.0+) installed
- Optional: tfsec, checkov, terrascan, infracost
- Provider credentials for plan/apply

## Capabilities

### 1. Terraform Configuration Parsing

Parse and analyze Terraform configurations:

```hcl
# Example configuration being analyzed
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = aws_subnet.private.id

  root_block_device {
    volume_size = 100
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name        = "web-server"
    Environment = var.environment
  }
}

resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Security finding: open to world
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 2. Security Scanning

#### tfsec Analysis

```bash
# Run tfsec security scan
tfsec . --format json --out tfsec-report.json

# Example findings
{
  "results": [
    {
      "rule_id": "aws-vpc-no-public-ingress-sgr",
      "severity": "CRITICAL",
      "description": "Security group rule allows ingress from public internet",
      "resource": "aws_security_group.web",
      "location": {
        "filename": "security.tf",
        "start_line": 15
      },
      "resolution": "Restrict ingress to specific CIDR blocks"
    }
  ]
}
```

#### Checkov Analysis

```bash
# Run Checkov security and compliance scan
checkov -d . --output json > checkov-report.json

# Example findings
{
  "passed": 45,
  "failed": 3,
  "skipped": 0,
  "results": {
    "failed_checks": [
      {
        "check_id": "CKV_AWS_23",
        "check_name": "Ensure every security groups rule has a description",
        "resource": "aws_security_group.web",
        "guideline": "https://docs.bridgecrew.io/docs/..."
      },
      {
        "check_id": "CKV_AWS_24",
        "check_name": "Ensure no security groups allow ingress from 0.0.0.0:0 to port 22",
        "resource": "aws_security_group.web"
      }
    ]
  }
}
```

#### Terrascan Analysis

```bash
# Run Terrascan policy scan
terrascan scan -d . -o json > terrascan-report.json
```

### 3. Cost Estimation

Using Infracost for cost analysis:

```bash
# Generate cost breakdown
infracost breakdown --path . --format json > cost-report.json

# Example output
{
  "version": "0.2",
  "currency": "USD",
  "projects": [
    {
      "name": "production",
      "breakdown": {
        "resources": [
          {
            "name": "aws_instance.web",
            "monthlyQuantity": 730,
            "unit": "hours",
            "hourlyRate": "0.0416",
            "monthlyCost": "30.37"
          },
          {
            "name": "aws_ebs_volume.data",
            "monthlyQuantity": 100,
            "unit": "GB",
            "monthlyCost": "10.00"
          }
        ],
        "totalMonthlyCost": "540.37",
        "totalHourlyCost": "0.74"
      }
    }
  ],
  "totalMonthlyCost": "540.37"
}
```

### 4. Drift Detection

Detect configuration drift:

```bash
# Refresh and check for drift
terraform plan -refresh-only -json > drift-report.json

# Example drift detection
{
  "resource_drift": [
    {
      "resource": "aws_instance.web",
      "address": "aws_instance.web",
      "changes": {
        "before": {
          "instance_type": "t3.medium"
        },
        "after": {
          "instance_type": "t3.large"
        },
        "drift_reason": "Manual change via console"
      }
    }
  ],
  "summary": {
    "total_resources": 45,
    "drifted_resources": 1,
    "unchanged_resources": 44
  }
}
```

### 5. Plan Visualization

Analyze and visualize Terraform plans:

```bash
# Generate plan
terraform plan -out=tfplan
terraform show -json tfplan > plan.json

# Plan analysis output
{
  "format_version": "1.0",
  "resource_changes": [
    {
      "address": "aws_instance.web",
      "mode": "managed",
      "type": "aws_instance",
      "name": "web",
      "change": {
        "actions": ["update"],
        "before": {
          "instance_type": "t3.small"
        },
        "after": {
          "instance_type": "t3.medium"
        }
      }
    }
  ],
  "summary": {
    "add": 2,
    "change": 1,
    "destroy": 0
  }
}
```

### 6. Module Analysis

Analyze Terraform module structure:

```javascript
// Module dependency analysis
{
  "modules": {
    "root": {
      "path": ".",
      "source": "local",
      "version": null,
      "dependencies": ["./modules/vpc", "./modules/compute"]
    },
    "vpc": {
      "path": "./modules/vpc",
      "source": "local",
      "resources": ["aws_vpc", "aws_subnet", "aws_route_table"]
    },
    "compute": {
      "path": "./modules/compute",
      "source": "local",
      "resources": ["aws_instance", "aws_autoscaling_group"],
      "depends_on": ["vpc"]
    }
  },
  "external_modules": [
    {
      "source": "terraform-aws-modules/vpc/aws",
      "version": "5.0.0",
      "registry": "registry.terraform.io"
    }
  ]
}
```

### 7. Compliance Checking

Check compliance with organizational policies:

```yaml
# Policy definition
policies:
  - name: require-encryption
    description: All storage must be encrypted
    resource_types: [aws_ebs_volume, aws_rds_instance, aws_s3_bucket]
    rules:
      - attribute: encrypted
        value: true
      - attribute: storage_encrypted
        value: true

  - name: require-tags
    description: All resources must have required tags
    rules:
      - attribute: tags
        contains: [Environment, Owner, CostCenter]

  - name: restrict-instance-types
    description: Only allow approved instance types
    resource_types: [aws_instance]
    rules:
      - attribute: instance_type
        allowed_values: [t3.micro, t3.small, t3.medium, t3.large]
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| Terraform MCP Server (HashiCorp) | Official Terraform Registry integration | [GitHub](https://github.com/hashicorp/terraform-mcp-server) |
| AWS Terraform MCP Server | Terraform with Checkov and AWS best practices | [AWS Labs](https://awslabs.github.io/mcp/) |

## Best Practices

### Security Scanning Workflow

```yaml
workflow:
  pre_commit:
    - terraform fmt -check
    - terraform validate
    - tfsec --minimum-severity HIGH

  ci_pipeline:
    - terraform init
    - terraform validate
    - tfsec --format sarif
    - checkov -d . --output sarif
    - infracost breakdown --path .

  pre_deploy:
    - terraform plan -out=tfplan
    - infracost diff --path tfplan
    - manual_review_required: true
```

### Recommended Thresholds

```yaml
security_thresholds:
  tfsec:
    max_critical: 0
    max_high: 0
    max_medium: 5
  checkov:
    min_passed_percentage: 90
  infracost:
    max_monthly_increase_percentage: 20
    require_approval_above: 1000  # USD
```

## Process Integration

This skill integrates with the following processes:
- `iac-review.js` - Primary IaC analysis workflow
- `cloud-architecture-design.js` - Architecture validation
- `devops-architecture-alignment.js` - DevOps integration

## Output Format

When analyzing configurations, provide structured output:

```json
{
  "operation": "analyze",
  "status": "completed",
  "configuration": {
    "path": "./infrastructure",
    "provider": "aws",
    "resources": 45,
    "modules": 5
  },
  "security": {
    "tool": "tfsec",
    "findings": {
      "critical": 0,
      "high": 2,
      "medium": 5,
      "low": 8
    },
    "passed": true,
    "threshold_exceeded": false
  },
  "compliance": {
    "tool": "checkov",
    "passed": 42,
    "failed": 3,
    "skipped": 0,
    "passed_percentage": 93.3
  },
  "cost": {
    "tool": "infracost",
    "monthly_estimate": "$540.37",
    "hourly_estimate": "$0.74",
    "change_from_baseline": "+$45.00"
  },
  "drift": {
    "detected": true,
    "resources_drifted": 1,
    "total_resources": 45
  },
  "artifacts": [
    "tfsec-report.json",
    "checkov-report.json",
    "cost-report.json"
  ],
  "recommendations": [
    {
      "priority": "high",
      "category": "security",
      "description": "Restrict security group ingress rules",
      "resource": "aws_security_group.web"
    }
  ]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Provider not configured` | Missing credentials | Configure provider credentials |
| `Module not found` | Invalid source path | Check module source configuration |
| `State lock error` | Concurrent access | Wait or force unlock |
| `Validation failed` | Invalid HCL syntax | Fix syntax errors |

## Constraints

- Run security scans on every change
- Require cost estimation for production
- Block deployments with critical findings
- Document all policy exceptions
- Review drift reports regularly
