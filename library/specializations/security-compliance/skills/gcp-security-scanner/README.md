# GCP Security Scanner

Automated GCP security configuration scanning and hardening skill using Security Command Center, Forseti, and ScoutSuite.

## Overview

This skill provides comprehensive security scanning for Google Cloud Platform environments. It identifies misconfigurations, compliance violations, and security risks across GCP projects and organizations using Google-native and third-party security tools.

## Key Features

- **Security Command Center**: Leverage GCP's native CSPM
- **IAM Analysis**: Review permissions and service accounts
- **Firewall Review**: Identify overly permissive VPC rules
- **Storage Security**: Check Cloud Storage bucket configurations
- **KMS Audit**: Review encryption key management
- **Organization Policies**: Assess organizational constraints

## GCP Services Covered

| Category | Services |
|----------|----------|
| Identity | IAM, Cloud Identity, Service Accounts |
| Compute | Compute Engine, GKE, Cloud Run |
| Storage | Cloud Storage, Persistent Disks |
| Database | Cloud SQL, Spanner, BigQuery |
| Network | VPC, Firewall, Cloud Armor |
| Security | Security Command Center, Cloud KMS |

## Compliance Frameworks

- CIS GCP Foundations Benchmark
- SOC 2 Trust Services Criteria
- PCI DSS v4.0
- HIPAA Security Rule
- ISO 27001
- NIST 800-53

## Security Command Center Integration

The skill leverages Security Command Center for:
- Security Health Analytics findings
- Event Threat Detection alerts
- Container Threat Detection
- Web Security Scanner results

## Usage

```javascript
skill: {
  name: 'gcp-security-scanner',
  context: {
    scanType: 'cis',
    projects: ['my-project'],
    includeSCC: true,
    complianceFrameworks: ['CIS', 'SOC2']
  }
}
```

## Related Processes

- Cloud Security Architecture Review
- GCP Project Hardening
- Compliance Monitoring
