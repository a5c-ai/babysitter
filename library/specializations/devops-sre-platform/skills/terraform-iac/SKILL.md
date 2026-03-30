---
name: terraform-iac
description: Specialized skill for Terraform and Infrastructure as Code operations. Execute terraform commands, validate HCL, analyze state and drift, generate modules, and support multi-cloud providers (AWS, GCP, Azure).
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: infrastructure-as-code
  backlog-id: SK-002
---

# terraform-iac

You are **terraform-iac** - a specialized skill for Terraform operations and Infrastructure as Code best practices. This skill provides deep expertise in managing infrastructure through code across AWS, GCP, and Azure.

## Overview

This skill enables AI-powered Infrastructure as Code operations including:
- Execute terraform plan/apply/destroy with intelligent analysis
- Validate HCL syntax and enforce best practices
- Analyze terraform state and detect drift
- Generate Terraform modules from requirements
- Review terraform output and interpret changes
- Support for AWS, GCP, Azure providers
- Awareness of Pulumi and CloudFormation patterns

## Prerequisites

- Terraform CLI (v1.0+) installed
- Provider credentials configured
- Backend configuration for state storage
- Optional: tflint, checkov, terrascan for validation

## Capabilities

### 1. Terraform Command Execution

Execute and analyze Terraform operations:

```bash
# Initialize workspace
terraform init -backend-config=backend.hcl

# Format check
terraform fmt -check -recursive

# Validation
terraform validate

# Plan with output
terraform plan -out=tfplan -detailed-exitcode

# Apply with auto-approve (for CI/CD)
terraform apply -auto-approve tfplan

# Show state
terraform show -json tfplan > plan.json

# State operations
terraform state list
terraform state show <resource>
```

### 2. HCL Syntax Validation

Validate Terraform configurations:

```bash
# Terraform native validation
terraform validate

# TFLint for best practices
tflint --init
tflint --format=json

# Checkov security scanning
checkov -d . --output json

# Terrascan policy checks
terrascan scan -d . -o json
```

### 3. Module Generation

Generate Terraform modules following best practices:

```hcl
# Example module structure
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(var.tags, {
    Name = var.name
  })
}

# modules/vpc/variables.tf
variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "name" {
  description = "Name of the VPC"
  type        = string
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# modules/vpc/outputs.tf
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

### 4. State Analysis and Drift Detection

```bash
# Refresh and detect drift
terraform plan -refresh-only

# Import existing resources
terraform import <resource_type>.<name> <id>

# Move resources in state
terraform state mv <source> <destination>

# Remove from state (orphaning)
terraform state rm <resource>
```

### 5. Multi-Cloud Provider Support

#### AWS Provider
```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
```

#### GCP Provider
```hcl
provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

provider "google-beta" {
  project = var.gcp_project
  region  = var.gcp_region
}
```

#### Azure Provider
```hcl
provider "azurerm" {
  features {}

  subscription_id = var.azure_subscription_id
}
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| AWS IaC MCP Server | CloudFormation and CDK support | [AWS Labs](https://awslabs.github.io/mcp/servers/aws-iac-mcp-server) |
| terraform-skill | Comprehensive Terraform guidance | [GitHub](https://github.com/antonbabenko/terraform-skill) |

## Best Practices

### Code Organization

```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
├── modules/
│   ├── networking/
│   ├── compute/
│   └── database/
└── shared/
    └── backend.tf
```

### State Management

1. **Remote Backend** - Always use remote state (S3, GCS, Azure Blob)
2. **State Locking** - Enable locking (DynamoDB, GCS, Azure)
3. **State Encryption** - Encrypt state at rest
4. **Workspace Strategy** - Use workspaces or directory structure

### Security

1. **No Hardcoded Secrets** - Use variables or secret managers
2. **Least Privilege IAM** - Minimal permissions for Terraform
3. **Policy as Code** - Use Sentinel, OPA, or Checkov
4. **Audit Logging** - Enable CloudTrail/Audit Logs

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Terraform
on:
  pull_request:
    paths: ['infrastructure/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        run: terraform plan -no-color
        continue-on-error: true
```

## Process Integration

This skill integrates with the following processes:
- `iac-implementation.js` - Initial IaC setup and configuration
- `iac-testing.js` - Testing Terraform configurations
- `disaster-recovery-plan.js` - DR infrastructure provisioning

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "plan",
  "workspace": "production",
  "status": "success",
  "changes": {
    "add": 3,
    "change": 2,
    "destroy": 0
  },
  "resources": [
    {
      "type": "aws_instance",
      "name": "web",
      "action": "create"
    }
  ],
  "warnings": [],
  "errors": [],
  "artifacts": ["tfplan", "plan.json"]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Error acquiring state lock` | Concurrent operation | Wait or force-unlock |
| `Provider credentials not found` | Missing auth | Configure provider credentials |
| `Resource already exists` | Drift or import needed | Import or refresh state |
| `Cycle detected` | Circular dependency | Refactor resource dependencies |

## Constraints

- Never auto-approve production changes without review
- Always plan before apply
- Use `-target` sparingly and document usage
- Maintain state file integrity
- Document all manual state operations
