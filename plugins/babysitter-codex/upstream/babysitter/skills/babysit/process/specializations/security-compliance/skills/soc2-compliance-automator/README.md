# SOC 2 Compliance Automator

Automated SOC 2 Trust Services Criteria compliance skill for control mapping, evidence collection, and audit preparation.

## Overview

This skill automates the SOC 2 compliance lifecycle from control mapping through audit preparation. It supports both Type I (point-in-time) and Type II (period of time) audits across all five Trust Services Categories.

## Key Features

- **Control Mapping**: Map controls to all SOC 2 TSC requirements
- **Evidence Automation**: Collect evidence from cloud providers and systems
- **Audit Preparation**: Generate complete audit packages
- **Gap Analysis**: Identify and prioritize compliance gaps
- **Continuous Monitoring**: Track control effectiveness over time

## Trust Services Categories

| Category | Description |
|----------|-------------|
| Security (CC) | Common Criteria for system protection |
| Availability (A) | System availability commitments |
| Processing Integrity (PI) | Data processing accuracy |
| Confidentiality (C) | Data protection controls |
| Privacy (P) | Personal information handling |

## Audit Deliverables

- Control matrices with evidence mapping
- System description documents
- Management assertion letters
- Evidence packages organized by control
- Gap analysis and remediation plans

## Usage

```javascript
skill: {
  name: 'soc2-compliance-automator',
  context: {
    auditType: 'Type2',
    trustCategories: ['Security', 'Availability'],
    auditPeriod: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  }
}
```

## Related Processes

- SOC 2 Compliance Audit Preparation
- Continuous Compliance Monitoring
- Security Control Assessment
