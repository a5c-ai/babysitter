---
name: employment-compliance
description: Ensure compliance with employment laws and regulations across jurisdictions
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: human-resources
  domain: business
  category: Compliance
  skill-id: SK-022
  dependencies:
    - Employment law databases
    - Regulatory updates
---

# Employment Law Compliance Skill

## Overview

The Employment Law Compliance skill provides capabilities for ensuring compliance with employment laws and regulations across multiple jurisdictions. This skill enables document validation, compliance monitoring, and audit preparation.

## Capabilities

### Document Validation
- Validate HR documents for legal compliance
- Review offer letters and employment agreements
- Check handbook policies
- Validate job postings
- Review termination documentation

### Regulatory Tracking
- Track regulatory requirements by jurisdiction
- Monitor federal, state, and local laws
- Identify applicable regulations
- Track regulatory changes
- Alert on new requirements

### Compliance Checklists
- Generate compliance checklists
- Create jurisdiction-specific requirements
- Build audit preparation guides
- Document compliance activities
- Track remediation items

### Required Notices
- Create required notices and postings
- Manage posting requirements by location
- Track notice distribution
- Document acknowledgments
- Handle multilingual requirements

### Audit Support
- Audit HR practices for compliance gaps
- Prepare audit documentation
- Create compliance reports
- Track findings and remediation
- Support external audits

### Classification Support
- Calculate FLSA classification determinations
- Review exempt vs. non-exempt status
- Support independent contractor analysis
- Document classification rationale
- Handle misclassification remediation

### EEO Compliance
- Support EEO/OFCCP compliance reporting
- Generate EEO-1 report data
- Track affirmative action requirements
- Monitor diversity metrics
- Support OFCCP audits

## Usage

### Compliance Check
```javascript
const complianceCheck = {
  document: {
    type: 'offer-letter',
    jurisdiction: {
      federal: true,
      state: 'California',
      locality: 'San Francisco'
    }
  },
  checkpoints: [
    {
      requirement: 'At-will statement',
      status: 'compliant',
      notes: 'Present and properly worded'
    },
    {
      requirement: 'Pay transparency',
      status: 'compliant',
      notes: 'Salary range included per CA law'
    },
    {
      requirement: 'Benefits summary',
      status: 'warning',
      notes: 'Missing SF HCSO disclosure'
    }
  ],
  recommendations: [
    'Add San Francisco Health Care Security Ordinance disclosure',
    'Include California Family Rights Act reference'
  ]
};
```

### Regulatory Monitor
```javascript
const regulatoryMonitor = {
  jurisdictions: {
    federal: true,
    states: ['California', 'New York', 'Texas', 'Washington'],
    localities: ['San Francisco', 'New York City', 'Seattle']
  },
  topics: [
    'minimum-wage',
    'paid-leave',
    'pay-transparency',
    'non-compete',
    'anti-harassment',
    'classification'
  ],
  alerts: {
    frequency: 'weekly',
    recipients: ['hr-compliance@company.com'],
    format: 'summary-with-action-items'
  },
  tracking: {
    effectiveDates: true,
    implementationDeadlines: true,
    complianceStatus: true
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| All processes | Cross-cutting compliance |
| workplace-investigation.js | Legal compliance guidance |
| pay-equity-analysis.js | Regulatory requirements |
| benefits-administration.js | Benefits compliance |

## Best Practices

1. **Stay Current**: Monitor regulatory changes continuously
2. **Document Everything**: Maintain compliance documentation
3. **Multi-State Awareness**: Apply strictest applicable standard
4. **Training**: Keep HR team trained on compliance
5. **Legal Partnership**: Work closely with employment counsel
6. **Proactive Approach**: Address issues before they become complaints

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Compliance Rate | Requirements met on time | 100% |
| Audit Findings | External audit issues | 0 critical |
| Regulatory Updates | Changes implemented on time | 100% |
| Training Completion | HR compliance training | 100% |
| Complaint Rate | Compliance-related complaints | Minimize |

## Related Skills

- SK-014: Pay Equity (pay compliance)
- SK-016: HR Investigation (investigation compliance)
- SK-015: Benefits Enrollment (benefits compliance)
