# Terraform Analyzer Skill

## Overview

The `terraform-analyzer` skill provides specialized capabilities for analyzing Terraform configurations. It supports security scanning, cost estimation, drift detection, and compliance checking.

## Quick Start

### Prerequisites

1. **Terraform CLI** (v1.0+) - Core requirement
2. **Optional Tools** - tfsec, checkov, terrascan, infracost

### Installation

The skill is included in the babysitter-sdk. For enhanced capabilities:

```bash
# Install tfsec
brew install tfsec

# Install checkov
pip install checkov

# Install terrascan
brew install terrascan

# Install infracost
brew install infracost
infracost auth login
```

## Usage

### Basic Operations

```bash
# Security scan
/skill terraform-analyzer security \
  --path ./infrastructure \
  --tools tfsec,checkov \
  --format json

# Cost estimation
/skill terraform-analyzer cost \
  --path ./infrastructure \
  --baseline ./baseline-cost.json

# Drift detection
/skill terraform-analyzer drift \
  --path ./infrastructure \
  --state s3://bucket/terraform.tfstate

# Full analysis
/skill terraform-analyzer analyze \
  --path ./infrastructure \
  --security \
  --cost \
  --compliance
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(terraformAnalyzerTask, {
  path: './infrastructure/production',
  analyses: ['security', 'cost', 'compliance'],
  thresholds: {
    maxCritical: 0,
    maxHigh: 0,
    maxMonthlyCostIncrease: 500
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Security Scanning** | tfsec, checkov, terrascan integration |
| **Cost Estimation** | infracost integration |
| **Drift Detection** | State vs actual comparison |
| **Plan Analysis** | Visualize and analyze plans |
| **Compliance** | Custom policy checking |
| **Module Analysis** | Dependency mapping |

## Examples

### Example 1: Pre-PR Security Check

```bash
/skill terraform-analyzer security \
  --path ./infrastructure \
  --tools tfsec,checkov \
  --fail-on critical,high \
  --output ./reports/security.sarif
```

### Example 2: Cost Comparison

```bash
/skill terraform-analyzer cost-diff \
  --path ./infrastructure \
  --compare-to main \
  --threshold 20% \
  --output ./reports/cost-diff.json
```

### Example 3: Compliance Audit

```bash
/skill terraform-analyzer compliance \
  --path ./infrastructure \
  --policy-set ./policies/company-standards.yaml \
  --report ./reports/compliance.json
```

### Example 4: Full Analysis Pipeline

```bash
/skill terraform-analyzer analyze \
  --path ./infrastructure \
  --security tfsec,checkov \
  --cost \
  --compliance ./policies \
  --drift \
  --output-dir ./reports
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TFSEC_PATH` | Path to tfsec | `tfsec` |
| `CHECKOV_PATH` | Path to checkov | `checkov` |
| `INFRACOST_API_KEY` | Infracost API key | - |
| `TERRAFORM_PATH` | Path to terraform | `terraform` |

### Skill Configuration

```yaml
# .babysitter/skills/terraform-analyzer.yaml
terraform-analyzer:
  security:
    tools: [tfsec, checkov]
    failOn: [critical, high]
    excludeChecks:
      - CKV_AWS_79  # Example exclusion with reason
    customRules: ./custom-rules
  cost:
    enabled: true
    currency: USD
    baseline: ./baseline-cost.json
    thresholds:
      maxIncrease: 500
      maxIncreasePercent: 20
  compliance:
    policies: ./policies
    frameworks: [cis-aws, soc2]
  reporting:
    format: [json, sarif, html]
    outputDir: ./reports
```

### Custom Policy Example

```yaml
# policies/company-standards.yaml
version: "1.0"
policies:
  - id: COMPANY_001
    name: require-encryption
    description: All storage resources must be encrypted
    severity: high
    resource_types:
      - aws_ebs_volume
      - aws_rds_instance
      - aws_s3_bucket
    condition:
      any:
        - attribute: encrypted
          equals: true
        - attribute: storage_encrypted
          equals: true
        - attribute: server_side_encryption_configuration
          exists: true

  - id: COMPANY_002
    name: require-tagging
    description: All resources must have required tags
    severity: medium
    condition:
      attribute: tags
      contains_keys: [Environment, Owner, CostCenter, Project]

  - id: COMPANY_003
    name: approved-regions
    description: Resources must be in approved regions
    severity: critical
    condition:
      attribute: region
      in: [us-east-1, us-west-2, eu-west-1]
```

## Process Integration

### Processes Using This Skill

| Process | Role |
|---------|------|
| `iac-review.js` | Primary IaC analysis |
| `cloud-architecture-design.js` | Architecture validation |
| `devops-architecture-alignment.js` | DevOps integration |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTerraformTask = defineTask({
  name: 'analyze-terraform',
  description: 'Analyze Terraform configuration for security and cost',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Analyze Terraform: ${inputs.path}`,
      skill: {
        name: 'terraform-analyzer',
        context: {
          path: inputs.path,
          analyses: inputs.analyses || ['security', 'cost'],
          securityTools: inputs.securityTools || ['tfsec', 'checkov'],
          thresholds: inputs.thresholds || {
            maxCritical: 0,
            maxHigh: 0
          },
          outputDir: inputs.outputDir || './reports'
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Security Tools Reference

### tfsec

Static analysis security scanner for Terraform.

| Feature | Description |
|---------|-------------|
| AWS checks | 100+ AWS security rules |
| Azure checks | 80+ Azure security rules |
| GCP checks | 60+ GCP security rules |
| Custom rules | Rego/JSON rule support |

**Common tfsec Rules:**

| Rule ID | Description |
|---------|-------------|
| `aws-ec2-no-public-ip` | EC2 should not have public IP |
| `aws-s3-enable-versioning` | S3 bucket versioning |
| `aws-vpc-no-public-ingress-sgr` | No 0.0.0.0/0 ingress |

### Checkov

Policy-as-code for IaC security and compliance.

| Feature | Description |
|---------|-------------|
| Compliance frameworks | CIS, SOC2, HIPAA, PCI-DSS |
| Custom policies | Python/YAML policies |
| SCA scanning | Terraform module vulnerabilities |

### Infracost

Cloud cost estimation for Terraform.

| Feature | Description |
|---------|-------------|
| Cost breakdown | Resource-level costs |
| Cost diff | Compare changes |
| CI/CD integration | PR comments |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `tfsec not found` | Install tfsec and verify PATH |
| `Infracost auth failed` | Run `infracost auth login` |
| `State access denied` | Check AWS/provider credentials |
| `Invalid HCL` | Run `terraform validate` first |

### Debug Mode

```bash
DEBUG=terraform-analyzer /skill terraform-analyzer analyze \
  --path ./infrastructure \
  --verbose
```

## Related Skills

- **terraform-iac** - Terraform operations (plan/apply)
- **k8s-validator** - Kubernetes manifest validation
- **cloudformation-analyzer** - CFN analysis

## References

- [tfsec](https://github.com/aquasecurity/tfsec)
- [Checkov](https://www.checkov.io/)
- [Terrascan](https://runterrascan.io/)
- [Infracost](https://www.infracost.io/)
- [Terraform Registry](https://registry.terraform.io/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SA-005
**Category:** Infrastructure as Code
**Status:** Active
