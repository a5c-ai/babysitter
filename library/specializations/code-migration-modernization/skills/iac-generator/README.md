# IaC Generator Skill

## Overview

The IaC Generator skill creates Infrastructure as Code from existing infrastructure. It generates Terraform, CloudFormation, or other IaC formats with proper structure and best practices.

## Quick Start

### Prerequisites

- Cloud account access
- Terraform/Pulumi installed
- Resource discovery permissions

### Basic Usage

1. **Discover resources**
   ```bash
   # Using Terraformer
   terraformer import aws --resources=ec2,vpc
   ```

2. **Review generated code**
   - Check resource definitions
   - Verify relationships
   - Review variables

3. **Organize and refine**
   - Create modules
   - Extract variables
   - Add documentation

## Features

### IaC Frameworks

| Framework | Languages | Cloud Support |
|-----------|-----------|---------------|
| Terraform | HCL | Multi-cloud |
| Pulumi | TypeScript/Python | Multi-cloud |
| CloudFormation | YAML/JSON | AWS |
| CDK | TypeScript/Python | AWS/Multi |
| Bicep | Bicep | Azure |

### Generation Features

- Resource discovery
- Dependency mapping
- Module organization
- Variable extraction

## Configuration

```json
{
  "source": {
    "cloud": "aws",
    "region": "us-east-1",
    "resourceTypes": ["ec2", "vpc", "rds", "s3"]
  },
  "output": {
    "format": "terraform",
    "moduleStructure": true,
    "outputDir": "./infrastructure"
  },
  "options": {
    "generateState": true,
    "extractVariables": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Terraform](https://www.terraform.io/)
- [Terraformer](https://github.com/GoogleCloudPlatform/terraformer)
