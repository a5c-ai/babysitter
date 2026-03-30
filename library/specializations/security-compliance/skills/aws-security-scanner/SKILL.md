---
name: aws-security-scanner
description: AWS security configuration scanning and hardening using Prowler, Security Hub, and AWS Config
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# AWS Security Scanner Skill

## Purpose

Automated AWS security configuration scanning and hardening to identify misconfigurations, compliance violations, and security risks across AWS accounts and organizations.

## Capabilities

### Prowler Security Assessments
- Run comprehensive Prowler security scans
- Execute CIS AWS Foundations Benchmark checks
- Run AWS Well-Architected security pillar assessments
- Check PCI DSS, HIPAA, GDPR compliance
- Generate multi-format reports (HTML, CSV, JSON)

### IAM Security Analysis
- Analyze IAM policies for over-permissive access
- Check for unused credentials and access keys
- Identify IAM users without MFA
- Review cross-account access configurations
- Detect privilege escalation paths
- Analyze service control policies (SCPs)

### S3 Bucket Security
- Identify publicly accessible buckets
- Check bucket encryption configurations
- Review bucket policies and ACLs
- Verify access logging enabled
- Check for sensitive data exposure
- Validate versioning and replication

### Network Security Analysis
- Review security group configurations
- Analyze Network ACLs
- Check VPC flow log enablement
- Identify public-facing resources
- Validate VPC endpoint configurations
- Check for overly permissive rules

### Encryption Verification
- Verify EBS volume encryption
- Check RDS encryption settings
- Validate S3 encryption configurations
- Review KMS key policies
- Check secrets manager configurations
- Verify certificate validity

### Logging and Monitoring
- Validate CloudTrail configuration
- Check CloudWatch log retention
- Verify GuardDuty enablement
- Review Security Hub findings
- Check Config rule compliance
- Validate alarm configurations

### Compliance Mapping
- Map findings to CIS Benchmarks
- Generate SOC 2 evidence
- Track PCI DSS compliance
- Document HIPAA controls
- Map to NIST frameworks

## AWS Services Covered

| Category | Services |
|----------|----------|
| Identity | IAM, SSO, Organizations |
| Compute | EC2, Lambda, ECS, EKS |
| Storage | S3, EBS, EFS, Glacier |
| Database | RDS, DynamoDB, Redshift |
| Network | VPC, CloudFront, Route53 |
| Security | Security Hub, GuardDuty, KMS |
| Monitoring | CloudTrail, CloudWatch, Config |

## Integrations

- **Prowler**: Open-source AWS security tool
- **AWS Security Hub**: Centralized security findings
- **AWS Config**: Configuration compliance
- **AWS CloudTrail**: API activity logging
- **AWS GuardDuty**: Threat detection
- **AWS IAM Access Analyzer**: Access analysis

## Target Processes

- Cloud Security Architecture Review
- Compliance Monitoring
- Security Posture Assessment
- AWS Account Hardening

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "scanType": {
      "type": "string",
      "enum": ["full", "cis", "pci", "hipaa", "gdpr", "custom"],
      "description": "Type of security scan"
    },
    "awsAccounts": {
      "type": "array",
      "items": { "type": "string" },
      "description": "AWS account IDs to scan"
    },
    "regions": {
      "type": "array",
      "items": { "type": "string" },
      "description": "AWS regions to scan"
    },
    "services": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific services to scan"
    },
    "severityThreshold": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low", "informational"]
    },
    "complianceFrameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["CIS", "PCI-DSS", "HIPAA", "GDPR", "SOC2", "NIST"]
      }
    },
    "excludeChecks": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Check IDs to exclude"
    }
  },
  "required": ["scanType"]
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
    "scanTimestamp": {
      "type": "string",
      "format": "date-time"
    },
    "accountsScanned": {
      "type": "array"
    },
    "regionsScanned": {
      "type": "array"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalChecks": { "type": "integer" },
        "passed": { "type": "integer" },
        "failed": { "type": "integer" },
        "warnings": { "type": "integer" }
      }
    },
    "findingsBySeverity": {
      "type": "object",
      "properties": {
        "critical": { "type": "integer" },
        "high": { "type": "integer" },
        "medium": { "type": "integer" },
        "low": { "type": "integer" }
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "checkId": { "type": "string" },
          "severity": { "type": "string" },
          "service": { "type": "string" },
          "region": { "type": "string" },
          "resourceId": { "type": "string" },
          "description": { "type": "string" },
          "remediation": { "type": "string" },
          "complianceMapping": { "type": "array" }
        }
      }
    },
    "complianceStatus": {
      "type": "object"
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "reportPaths": {
      "type": "object",
      "properties": {
        "html": { "type": "string" },
        "csv": { "type": "string" },
        "json": { "type": "string" }
      }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'aws-security-scanner',
  context: {
    scanType: 'cis',
    awsAccounts: ['123456789012'],
    regions: ['us-east-1', 'us-west-2'],
    complianceFrameworks: ['CIS', 'SOC2'],
    severityThreshold: 'medium'
  }
}
```
