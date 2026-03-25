# Phishing Simulation Skill

Phishing simulation campaign execution and analysis skill for security awareness assessment and training effectiveness measurement.

## Overview

This skill enables organizations to test and improve their security awareness posture through controlled phishing simulations. It supports various attack types, tracks user responses, identifies high-risk individuals, and provides targeted training recommendations.

## Key Features

- **Template Generation**: Create realistic phishing scenarios
- **Campaign Execution**: Schedule and launch simulations
- **Response Tracking**: Monitor clicks, submissions, and reports
- **Risk Identification**: Flag high-risk users and repeat offenders
- **Training Integration**: Recommend targeted security training
- **Benchmark Comparison**: Compare against industry standards

## Simulation Types

| Type | Description | Use Case |
|------|-------------|----------|
| Mass Phishing | Broad organization testing | Baseline assessment |
| Spear Phishing | Targeted attacks | Advanced testing |
| Whaling | Executive targeting | Leadership awareness |
| Department-specific | Targeted group testing | Focused training |

## Metrics Tracked

- Email open rates
- Link click rates
- Credential submission rates
- Attachment open rates
- Phishing report rates
- Response times

## Deliverables

- Campaign summary reports
- Department-level analysis
- High-risk user identification
- Training recommendations
- Trend analysis over time

## Usage

```javascript
skill: {
  name: 'phishing-simulation-skill',
  context: {
    campaignType: 'mass',
    templateCategory: 'password-reset',
    targetGroups: ['all-employees'],
    difficulty: 'medium'
  }
}
```

## Related Processes

- Security Awareness Training Program
- Human Risk Assessment
- Social Engineering Testing
