# PCI DSS Compliance Automator

Automated PCI DSS compliance skill for cardholder data protection, SAQ automation, ASV scan orchestration, and compliance reporting.

## Overview

This skill automates Payment Card Industry Data Security Standard compliance activities for merchants and service providers. It supports CDE scoping, SAQ completion, ASV scan management, control validation, and compliance reporting aligned with PCI DSS v4.0.

## Key Features

- **CDE Scoping**: Identify and document cardholder data environment
- **SAQ Automation**: Determine SAQ type and auto-populate responses
- **ASV Management**: Orchestrate quarterly vulnerability scans
- **Control Validation**: Assess all 12 PCI DSS requirements
- **Compliance Reporting**: Generate AOC and ROC artifacts

## PCI DSS Requirements

| Requirement | Description | Assessment |
|-------------|-------------|------------|
| 1 | Network security controls | Firewall and segmentation review |
| 2 | Secure configurations | Default password and config checks |
| 3 | Stored data protection | Encryption and retention validation |
| 4 | Data in transit | TLS and transmission security |
| 5 | Malware protection | Antivirus and anti-malware verification |
| 6 | Secure development | SDLC and patch management |
| 7-9 | Access control | Physical and logical access review |
| 10-11 | Monitoring and testing | Logging, IDS, and penetration testing |
| 12 | Security policies | Policy and procedure assessment |

## SAQ Types Supported

- SAQ A: Card-not-present, fully outsourced
- SAQ A-EP: E-commerce with website affecting security
- SAQ B/B-IP: Imprint or standalone terminal merchants
- SAQ C/C-VT: Payment application merchants
- SAQ D: All other merchants and service providers
- SAQ P2PE: Point-to-point encryption merchants

## Usage

```javascript
skill: {
  name: 'pci-dss-compliance-automator',
  context: {
    assessmentType: 'full',
    merchantLevel: 2,
    saqType: 'D-Merchant'
  }
}
```

## Related Processes

- PCI DSS Compliance Process
- Quarterly ASV Scanning
- Annual Assessment Preparation
