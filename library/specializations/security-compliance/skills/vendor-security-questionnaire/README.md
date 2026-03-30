# Vendor Security Questionnaire

Automated vendor security assessment skill for questionnaire generation, response analysis, and risk scoring.

## Overview

This skill automates the vendor security assessment process by generating standardized questionnaires, parsing vendor responses, calculating security scores, and generating risk reports for third-party risk management programs.

## Key Features

- **Questionnaire Generation**: Create SIG, CAIQ, and custom questionnaires
- **Response Parsing**: Analyze vendor responses and identify gaps
- **Security Scoring**: Calculate risk-adjusted security scores
- **Status Tracking**: Monitor assessment workflow and deadlines
- **Risk Reporting**: Generate executive and technical reports
- **Compliance Monitoring**: Track vendor security commitments

## Questionnaire Standards

| Standard | Risk Level | Questions |
|----------|------------|-----------|
| SIG Lite | Low | ~100 |
| SIG Core | Medium | ~300 |
| SIG Full | High/Critical | ~800+ |
| CAIQ | Cloud providers | ~300 |
| Custom | Specific needs | Variable |

## Assessment Domains

- Information Security Management
- Access Control
- Data Protection
- Network Security
- Application Security
- Physical Security
- Business Continuity
- Incident Response
- Compliance and Legal

## Deliverables

- Risk-tiered questionnaires
- Response gap analysis
- Security posture scores
- Risk finding reports
- Benchmark comparisons
- Remediation recommendations

## Usage

```javascript
skill: {
  name: 'vendor-security-questionnaire',
  context: {
    operation: 'generate',
    vendorInfo: {
      vendorName: 'Cloud SaaS Provider',
      riskTier: 'high'
    },
    questionnaireType: 'SIG-Core'
  }
}
```

## Related Processes

- Third-Party Vendor Security Assessment
- Vendor Onboarding Security Review
- Annual Vendor Reassessment
