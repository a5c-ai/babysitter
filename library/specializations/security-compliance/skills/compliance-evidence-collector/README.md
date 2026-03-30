# Compliance Evidence Collector

Automated evidence collection skill for gathering compliance artifacts from cloud providers, identity systems, and security tools across multiple frameworks.

## Overview

This skill automates the collection of compliance evidence across multiple frameworks. It gathers configuration snapshots, access control evidence, logs, policies, and documentation from cloud providers, identity systems, and security tools with full chain of custody tracking.

## Key Features

- **Cloud Configuration**: Capture AWS, Azure, GCP configuration snapshots
- **Access Control**: Export IAM, RBAC, and authentication evidence
- **Log Collection**: Gather and verify security event logs
- **Policy Management**: Version control and track policy documents
- **Screenshot Automation**: Capture UI-based evidence for manual controls
- **Chain of Custody**: Maintain evidence integrity and metadata

## Evidence Types

| Type | Sources | Examples |
|------|---------|----------|
| Cloud Config | AWS, Azure, GCP | Security groups, IAM policies, encryption |
| Access Control | IdPs, Cloud IAM | User lists, roles, MFA status |
| Logs | SIEM, Cloud logs | Audit trails, security events |
| Policies | Document stores | Security policies, procedures |
| Screenshots | UI captures | Console configs, approvals |

## Framework Support

- SOC 2 Type I/II
- GDPR
- HIPAA
- PCI DSS
- ISO 27001
- NIST CSF/800-53
- FedRAMP

## Deliverables

- Evidence inventory with metadata
- Chain of custody documentation
- Audit-ready packages organized by control
- Gap analysis for missing evidence
- Evidence integrity hashes

## Usage

```javascript
skill: {
  name: 'compliance-evidence-collector',
  context: {
    frameworks: ['SOC2', 'ISO27001'],
    evidenceTypes: ['cloud-config', 'access-control', 'logs'],
    cloudProviders: ['AWS', 'Azure']
  }
}
```

## Related Processes

- All compliance audit processes
- Continuous compliance monitoring
- Audit preparation
