---
name: iac-generator
description: Generate Infrastructure as Code from existing infrastructure with Terraform/CloudFormation support
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# IaC Generator Skill

Generates Infrastructure as Code from existing infrastructure, supporting Terraform, CloudFormation, and other IaC frameworks.

## Purpose

Enable infrastructure codification for:
- Resource discovery
- Terraform/CloudFormation generation
- Module structuring
- Variable extraction
- State management setup

## Capabilities

### 1. Resource Discovery
- Scan cloud accounts
- Discover existing resources
- Map relationships
- Document configurations

### 2. Terraform/CloudFormation Generation
- Generate HCL/YAML code
- Create resource definitions
- Handle dependencies
- Support multiple clouds

### 3. Module Structuring
- Organize into modules
- Create reusable components
- Design folder structure
- Handle environments

### 4. Variable Extraction
- Extract configurable values
- Create variable files
- Document defaults
- Handle secrets

### 5. State Management Setup
- Configure remote state
- Set up locking
- Handle state imports
- Manage workspaces

### 6. Best Practice Enforcement
- Apply naming conventions
- Tag resources
- Implement security controls
- Add monitoring

## Tool Integrations

| Tool | Cloud | Integration Method |
|------|-------|-------------------|
| Terraform | Multi | CLI |
| Pulumi | Multi | CLI |
| AWS CDK | AWS | CLI |
| Former2 | AWS | CLI |
| Terraformer | Multi | CLI |
| Azure Bicep | Azure | CLI |

## Output Schema

```json
{
  "generationId": "string",
  "timestamp": "ISO8601",
  "infrastructure": {
    "resources": "number",
    "modules": "number",
    "variables": "number"
  },
  "artifacts": {
    "mainTf": "string",
    "moduleDir": "string",
    "variablesFile": "string",
    "stateConfig": "string"
  },
  "imports": [],
  "warnings": []
}
```

## Integration with Migration Processes

- **cloud-migration**: Infrastructure provisioning
- **containerization**: Kubernetes IaC

## Related Skills

- `cloud-readiness-assessor`: Pre-migration assessment
- `containerization-assistant`: Container infrastructure

## Related Agents

- `cloud-migration-engineer`: Infrastructure deployment
- `infrastructure-migration-agent`: IaC migration
