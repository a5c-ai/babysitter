# Azure Security Scanner

Automated Azure security configuration scanning and hardening skill using Microsoft Defender for Cloud, Azure Policy, and ScoutSuite.

## Overview

This skill provides comprehensive security scanning for Azure environments. It identifies misconfigurations, compliance violations, and security risks across Azure subscriptions and tenants using Microsoft-native and third-party security tools.

## Key Features

- **Defender for Cloud**: Leverage Microsoft's CSPM capabilities
- **Azure AD Analysis**: Review identity security and conditional access
- **NSG Review**: Identify overly permissive network rules
- **Storage Security**: Check public access and encryption
- **Key Vault Audit**: Review access policies and configurations
- **Policy Compliance**: Assess Azure Policy assignments

## Azure Services Covered

| Category | Services |
|----------|----------|
| Identity | Azure AD, PIM, Conditional Access |
| Compute | VMs, App Services, Functions, AKS |
| Storage | Storage Accounts, Blobs, Files |
| Database | SQL Database, Cosmos DB |
| Network | VNets, NSGs, Azure Firewall |
| Security | Defender, Key Vault, Sentinel |

## Compliance Frameworks

- CIS Azure Foundations Benchmark
- SOC 2 Trust Services Criteria
- PCI DSS v4.0
- HIPAA Security Rule
- ISO 27001
- NIST 800-53

## Secure Score

The skill reports Microsoft Defender for Cloud Secure Score metrics, including:
- Current score and maximum possible
- Top recommendations by impact
- Remediation guidance for each finding

## Usage

```javascript
skill: {
  name: 'azure-security-scanner',
  context: {
    scanType: 'cis',
    subscriptions: ['sub-id'],
    includeAzureAD: true,
    complianceFrameworks: ['CIS', 'SOC2']
  }
}
```

## Related Processes

- Cloud Security Architecture Review
- Azure Subscription Hardening
- Compliance Monitoring
