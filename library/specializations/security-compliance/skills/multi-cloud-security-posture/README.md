# Multi-Cloud Security Posture

Unified cloud security posture management (CSPM) skill for aggregating and normalizing security findings across AWS, Azure, and GCP.

## Overview

This skill provides a consolidated view of security posture across multiple cloud providers. It aggregates findings from cloud-native tools, normalizes metrics for comparison, tracks remediation progress, and generates unified compliance reports.

## Key Features

- **Finding Aggregation**: Collect and correlate findings across clouds
- **Metric Normalization**: Standardize severity and categories
- **CIS Benchmarks**: Compare posture against industry benchmarks
- **Remediation Tracking**: Monitor fix progress across environments
- **Unified Reporting**: Generate executive and technical reports
- **Drift Detection**: Alert on security posture changes

## Normalized View

| Category | AWS | Azure | GCP |
|----------|-----|-------|-----|
| Identity | IAM | Azure AD | Cloud IAM |
| Compute | EC2 | VMs | Compute Engine |
| Storage | S3 | Storage Accounts | Cloud Storage |
| Network | VPC/SGs | VNet/NSGs | VPC/Firewall |
| Encryption | KMS | Key Vault | Cloud KMS |

## Compliance Frameworks

- CIS Benchmarks (all major clouds)
- SOC 2 Type II
- PCI DSS v4.0
- HIPAA Security Rule
- ISO 27001
- NIST 800-53

## Deliverables

- Aggregate security posture score
- Cloud-by-cloud comparison
- Compliance gap analysis
- Remediation progress metrics
- Trend analysis reports

## Usage

```javascript
skill: {
  name: 'multi-cloud-security-posture',
  context: {
    cloudProviders: ['AWS', 'Azure', 'GCP'],
    complianceFrameworks: ['CIS', 'SOC2'],
    includeRemediationStatus: true
  }
}
```

## Related Processes

- Cloud Security Architecture Review
- Continuous Compliance Monitoring
- Multi-Cloud Governance
