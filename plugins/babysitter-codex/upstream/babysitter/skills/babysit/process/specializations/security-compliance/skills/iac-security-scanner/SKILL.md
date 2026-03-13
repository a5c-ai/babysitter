---
name: iac-security-scanner
description: Infrastructure as Code security scanning and policy enforcement for Terraform, CloudFormation, Kubernetes, and Pulumi
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# IaC Security Scanner Skill

## Purpose

Infrastructure as Code security scanning and policy enforcement to identify misconfigurations, security vulnerabilities, and compliance violations in cloud infrastructure definitions before deployment.

## Capabilities

### Terraform Security Scanning
- Scan Terraform configurations for security misconfigurations
- Check for exposed resources (public S3 buckets, open security groups)
- Validate encryption settings for data at rest and in transit
- Detect hardcoded secrets in Terraform files
- Analyze Terraform state files for sensitive data exposure

### CloudFormation Analysis
- Scan CloudFormation templates for security issues
- Check IAM policy configurations for least privilege
- Validate network configuration security
- Detect insecure default configurations

### Kubernetes Manifest Scanning
- Analyze Kubernetes YAML manifests for security issues
- Check pod security standards compliance
- Validate resource limits and quotas
- Detect privileged containers and host path mounts

### Pulumi Code Analysis
- Scan Pulumi TypeScript/Python code for security issues
- Check cloud resource configurations
- Validate security best practices

### Policy Enforcement
- Define and enforce custom security policies using OPA/Rego
- Create guardrails for cloud resource configurations
- Block deployments that violate security policies
- Generate policy compliance reports

### Compliance Mapping
- Map findings to compliance frameworks (CIS, NIST, SOC 2, PCI-DSS)
- Generate compliance gap analysis reports
- Track remediation progress against compliance requirements

## Integrations

- **Checkov**: Multi-cloud IaC scanner by Bridgecrew
- **tfsec**: Terraform security scanner
- **KICS**: Keeping Infrastructure as Code Secure
- **Terrascan**: IaC security scanner
- **OPA/Rego**: Policy as code engine
- **Snyk IaC**: Infrastructure as Code security testing

## Target Processes

- IaC Security Scanning Process
- Cloud Security Architecture Review
- DevSecOps Pipeline Integration
- Infrastructure Deployment Pipeline
- Compliance Continuous Monitoring

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "iacPath": {
      "type": "string",
      "description": "Path to IaC files or directory"
    },
    "iacType": {
      "type": "string",
      "enum": ["terraform", "cloudformation", "kubernetes", "pulumi", "arm", "ansible"],
      "description": "Type of IaC to scan"
    },
    "scanners": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["checkov", "tfsec", "kics", "terrascan", "snyk"]
      },
      "description": "Scanners to use"
    },
    "complianceFrameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["CIS", "NIST", "SOC2", "PCI-DSS", "HIPAA", "GDPR"]
      }
    },
    "customPolicies": {
      "type": "string",
      "description": "Path to custom OPA/Rego policies"
    },
    "severityThreshold": {
      "type": "string",
      "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    },
    "excludePaths": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["iacPath", "iacType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "scanId": {
      "type": "string"
    },
    "iacPath": {
      "type": "string"
    },
    "scanTimestamp": {
      "type": "string",
      "format": "date-time"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalFiles": { "type": "integer" },
        "filesScanned": { "type": "integer" },
        "passedChecks": { "type": "integer" },
        "failedChecks": { "type": "integer" },
        "skippedChecks": { "type": "integer" }
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "checkId": { "type": "string" },
          "severity": { "type": "string" },
          "resourceType": { "type": "string" },
          "resourceName": { "type": "string" },
          "filePath": { "type": "string" },
          "lineNumber": { "type": "integer" },
          "description": { "type": "string" },
          "remediation": { "type": "string" },
          "complianceMapping": { "type": "array" }
        }
      }
    },
    "complianceReport": {
      "type": "object"
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'iac-security-scanner',
  context: {
    iacPath: './infrastructure/terraform',
    iacType: 'terraform',
    scanners: ['checkov', 'tfsec'],
    complianceFrameworks: ['CIS', 'SOC2'],
    severityThreshold: 'MEDIUM'
  }
}
```
