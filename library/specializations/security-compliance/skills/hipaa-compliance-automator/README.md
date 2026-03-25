# HIPAA Compliance Automator

Automated HIPAA compliance skill for ePHI protection, safeguards assessment, risk analysis, and audit preparation.

## Overview

This skill automates Health Insurance Portability and Accountability Act compliance activities for covered entities and business associates. It supports ePHI inventory, safeguards assessment, risk analysis, BAA management, and breach notification procedures.

## Key Features

- **ePHI Tracking**: Discover and catalog Protected Health Information
- **Safeguards Assessment**: Evaluate administrative, technical, and physical safeguards
- **Risk Analysis**: Comprehensive threat and vulnerability assessment
- **BAA Management**: Business Associate Agreement tracking and compliance
- **Breach Response**: Notification procedures and documentation

## HIPAA Safeguards Coverage

| Category | Examples | Assessment |
|----------|----------|------------|
| Administrative | Security management, workforce security, training | Policy and procedure review |
| Technical | Access control, audit controls, encryption | Technical validation |
| Physical | Facility access, workstation security, device controls | Physical security assessment |

## Compliance Deliverables

- ePHI inventory and data flow maps
- Safeguards assessment reports
- Risk analysis documentation
- BAA compliance tracking
- Breach notification packages
- Gap analysis and remediation plans

## Usage

```javascript
skill: {
  name: 'hipaa-compliance-automator',
  context: {
    assessmentType: 'full',
    entityType: 'covered_entity',
    scope: {
      systems: ['EHR', 'Patient Portal'],
      facilities: ['Main Hospital']
    }
  }
}
```

## Related Processes

- HIPAA Security and Privacy Compliance
- Security Risk Analysis
- Business Associate Compliance
