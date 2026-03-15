# AWS Security Scanner

Automated AWS security configuration scanning and hardening skill using Prowler, Security Hub, and AWS Config.

## Overview

This skill provides comprehensive security scanning for AWS environments. It identifies misconfigurations, compliance violations, and security risks across AWS accounts and organizations using industry-standard tools and AWS-native services.

## Key Features

- **Prowler Assessments**: Run comprehensive security scans with 300+ checks
- **IAM Analysis**: Detect over-permissive policies and credential issues
- **S3 Security**: Identify public buckets and encryption gaps
- **Network Review**: Analyze security groups and VPC configurations
- **Encryption Validation**: Verify encryption at rest and in transit
- **Compliance Mapping**: Map findings to CIS, SOC 2, PCI DSS, HIPAA

## AWS Services Covered

| Category | Services |
|----------|----------|
| Identity | IAM, SSO, Organizations |
| Compute | EC2, Lambda, ECS, EKS |
| Storage | S3, EBS, EFS |
| Database | RDS, DynamoDB, Redshift |
| Network | VPC, Security Groups, NACLs |
| Security | Security Hub, GuardDuty, KMS |

## Compliance Frameworks

- CIS AWS Foundations Benchmark
- SOC 2 Trust Services Criteria
- PCI DSS v4.0
- HIPAA Security Rule
- GDPR Technical Controls
- NIST 800-53

## Usage

```javascript
skill: {
  name: 'aws-security-scanner',
  context: {
    scanType: 'cis',
    awsAccounts: ['123456789012'],
    regions: ['us-east-1'],
    complianceFrameworks: ['CIS', 'SOC2']
  }
}
```

## Related Processes

- Cloud Security Architecture Review
- Compliance Monitoring
- AWS Account Hardening
