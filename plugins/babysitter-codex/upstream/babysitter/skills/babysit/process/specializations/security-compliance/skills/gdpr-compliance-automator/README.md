# GDPR Compliance Automator

Automated GDPR compliance skill for data mapping, consent management, DSAR handling, and privacy impact assessments.

## Overview

This skill automates General Data Protection Regulation compliance activities across the full privacy lifecycle. It supports data discovery, consent tracking, data subject request handling, DPIA creation, and breach notification procedures.

## Key Features

- **Data Mapping**: Discover and catalog personal data across systems
- **Consent Management**: Track consent collection and withdrawal
- **DSAR Handling**: Automate data subject request processing
- **DPIA/PIA**: Generate and manage privacy impact assessments
- **Breach Response**: Document incidents and manage notifications
- **Cross-Border Transfers**: Track international data transfer compliance

## GDPR Rights Supported

| Right | Article | Automation |
|-------|---------|------------|
| Access | 15 | Data discovery and report generation |
| Rectification | 16 | Data correction workflows |
| Erasure | 17 | Deletion request processing |
| Portability | 20 | Data export in standard formats |
| Restriction | 18 | Processing limitation tracking |
| Objection | 21 | Objection handling workflows |

## Compliance Deliverables

- Records of Processing Activities (RoPA)
- Data Protection Impact Assessments
- Consent audit trails
- DSAR response packages
- Breach notification documents
- Gap analysis reports

## Usage

```javascript
skill: {
  name: 'gdpr-compliance-automator',
  context: {
    assessmentType: 'full',
    scope: {
      systems: ['CRM', 'HR System'],
      dataCategories: ['customer', 'employee']
    }
  }
}
```

## Related Processes

- GDPR Compliance Assessment
- Privacy Impact Assessments
- Data Subject Request Handling
