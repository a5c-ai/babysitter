# Terraform/IaC Skill

## Overview

The `terraform-iac` skill provides specialized capabilities for Terraform and Infrastructure as Code operations. It enables AI-powered infrastructure management including planning, applying, state analysis, and multi-cloud provider support.

## Quick Start

### Prerequisites

1. **Terraform CLI** - Install from [terraform.io](https://developer.hashicorp.com/terraform/downloads)
2. **Provider Credentials** - AWS, GCP, or Azure credentials configured
3. **Optional Tools** - tflint, checkov, terrascan for enhanced validation

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For enhanced capabilities:

```bash
# Install terraform-skill for guidance
# Follow instructions at https://github.com/antonbabenko/terraform-skill

# Install validation tools
brew install tflint
pip install checkov
```

## Usage

### Basic Operations

```bash
# Invoke the skill for infrastructure planning
/skill terraform-iac plan --directory ./infrastructure/production

# Generate a new module
/skill terraform-iac generate-module --name vpc --provider aws

# Analyze state drift
/skill terraform-iac analyze-drift --workspace production
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(terraformTask, {
  operation: 'plan',
  directory: './infrastructure/production',
  varFile: 'production.tfvars',
  outputPlan: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Command Execution** | Run terraform plan/apply/destroy with analysis |
| **HCL Validation** | Validate syntax and best practices |
| **State Analysis** | Detect drift and analyze state |
| **Module Generation** | Create reusable Terraform modules |
| **Multi-Cloud** | AWS, GCP, Azure provider support |
| **Security Scanning** | Integrate with Checkov, tflint |

## Examples

### Example 1: Plan with Security Scan

```bash
# The skill will:
# 1. Run terraform validate
# 2. Execute tflint checks
# 3. Run Checkov security scan
# 4. Generate terraform plan
# 5. Provide summary of changes

/skill terraform-iac plan-secure \
  --directory ./infrastructure/production \
  --var-file production.tfvars
```

### Example 2: Generate VPC Module

```bash
# Generate a production-ready VPC module
/skill terraform-iac generate-module \
  --name vpc \
  --provider aws \
  --features "public-subnets,private-subnets,nat-gateway,flow-logs"
```

### Example 3: Drift Detection

```bash
# Detect and report configuration drift
/skill terraform-iac detect-drift \
  --workspace production \
  --report-format json
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TF_LOG` | Terraform log level | - |
| `TF_CLI_CONFIG_FILE` | Terraform CLI config | `~/.terraformrc` |
| `AWS_PROFILE` | AWS profile for AWS provider | `default` |
| `GOOGLE_PROJECT` | GCP project ID | - |
| `ARM_SUBSCRIPTION_ID` | Azure subscription | - |

### Skill Configuration

```yaml
# .babysitter/skills/terraform-iac.yaml
terraform-iac:
  defaultBackend: s3
  stateLocking: true
  securityScan:
    enabled: true
    tools: [tflint, checkov]
  autoFormat: true
```

## Process Integration

### Processes Using This Skill

1. **iac-implementation.js** - Initial infrastructure setup
2. **iac-testing.js** - Testing Terraform configurations
3. **disaster-recovery-plan.js** - DR infrastructure provisioning
4. **cost-optimization.js** - Resource rightsizing via IaC

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const provisionInfrastructureTask = defineTask({
  name: 'provision-infrastructure',
  description: 'Provision infrastructure using Terraform',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Terraform ${inputs.operation} - ${inputs.environment}`,
      skill: {
        name: 'terraform-iac',
        context: {
          operation: inputs.operation,
          directory: inputs.directory,
          varFile: `${inputs.environment}.tfvars`,
          autoApprove: inputs.environment !== 'production',
          outputPlanFile: `tfplan-${inputs.environment}`
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

## MCP Server Reference

### AWS IaC MCP Server (Official)

Official AWS server for CloudFormation and CDK assistance.

**Features:**
- Template validation
- CDK best practices
- Compliance checking
- Deployment troubleshooting

**Documentation:** https://awslabs.github.io/mcp/servers/aws-iac-mcp-server

### terraform-skill (Anton Babenko)

Comprehensive Terraform/OpenTofu guidance from a Terraform expert.

**Features:**
- Testing strategies (Terratest, terraform-compliance)
- Module patterns and conventions
- CI/CD workflow templates
- Production-ready patterns

**GitHub:** https://github.com/antonbabenko/terraform-skill

## Directory Structure

Recommended project structure:

```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf          # Environment-specific configuration
│   │   ├── variables.tf     # Input variables
│   │   ├── outputs.tf       # Outputs
│   │   ├── terraform.tfvars # Variable values
│   │   └── backend.tf       # Backend configuration
│   ├── staging/
│   └── production/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   └── database/
└── global/
    ├── iam/
    └── dns/
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `State lock timeout` | Check for orphaned locks, use `terraform force-unlock` |
| `Provider not found` | Run `terraform init` or check provider version constraints |
| `Credentials error` | Verify environment variables or credential files |
| `Module not found` | Check module source path or run `terraform get` |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
TF_LOG=DEBUG /skill terraform-iac plan --directory ./infrastructure
```

## Related Skills

- **aws-cloud** - AWS-specific infrastructure operations
- **gcp-cloud** - GCP-specific infrastructure operations
- **azure-cloud** - Azure-specific infrastructure operations
- **gitops** - GitOps workflows for infrastructure

## References

- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [terraform-skill](https://github.com/antonbabenko/terraform-skill)
- [AWS IaC MCP Server](https://awslabs.github.io/mcp/servers/aws-iac-mcp-server)
- [Checkov](https://www.checkov.io/)
- [tflint](https://github.com/terraform-linters/tflint)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-002
**Category:** Infrastructure as Code
**Status:** Active
