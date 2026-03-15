# IaC Security Scanner

Infrastructure as Code security scanning and policy enforcement skill for Terraform, CloudFormation, Kubernetes manifests, and Pulumi configurations.

## Overview

This skill provides comprehensive security scanning for Infrastructure as Code before deployment. It identifies misconfigurations, security vulnerabilities, and compliance violations across multiple IaC platforms and cloud providers.

## Key Features

- **Multi-Platform Support**: Terraform, CloudFormation, Kubernetes, Pulumi, ARM, Ansible
- **Policy Enforcement**: Custom security policies using OPA/Rego
- **Compliance Mapping**: Map findings to CIS, NIST, SOC 2, PCI-DSS, HIPAA
- **Secret Detection**: Find hardcoded credentials in IaC files
- **Remediation Guidance**: Actionable fix recommendations for each finding

## Supported Scanners

| Scanner | Platforms | Features |
|---------|-----------|----------|
| Checkov | Multi-cloud | 1000+ built-in policies |
| tfsec | Terraform | Terraform-specific checks |
| KICS | Multi-cloud | Query-based scanning |
| Terrascan | Multi-cloud | Policy as code |
| Snyk IaC | Multi-cloud | Developer-friendly output |

## Common Checks

- Publicly accessible resources (S3, storage accounts)
- Encryption at rest and in transit
- IAM policy least privilege violations
- Network security group misconfigurations
- Logging and monitoring disabled
- Hardcoded secrets and credentials

## Usage

```javascript
skill: {
  name: 'iac-security-scanner',
  context: {
    iacPath: './terraform',
    iacType: 'terraform',
    scanners: ['checkov', 'tfsec'],
    complianceFrameworks: ['CIS', 'SOC2']
  }
}
```

## Related Processes

- IaC Security Scanning Process
- Cloud Security Architecture Review
- DevSecOps Pipeline Integration
