---
name: ats-integration
description: Integration with Applicant Tracking Systems and automated recruitment workflow management
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
  category: Talent Acquisition
  skill-id: SK-001
  dependencies:
    - Greenhouse API
    - Lever API
    - Workday Recruiting API
    - iCIMS API
---

# ATS Integration Skill

## Overview

The ATS Integration skill provides specialized capabilities for integrating with Applicant Tracking Systems and automating recruitment workflows. This skill enables seamless job requisition management, candidate tracking, interview scheduling, and compliance reporting across major ATS platforms.

## Capabilities

### Job Requisition Management
- Parse and standardize job requisitions across ATS platforms
- Create and update job postings
- Manage approval workflows
- Configure job board distribution
- Track requisition status and metrics

### Candidate Data Management
- Extract and normalize candidate data from multiple sources
- Generate ATS-compatible candidate profiles
- Manage candidate pipeline stages
- Track application sources and attribution
- Handle duplicate detection and merging

### Interview Scheduling
- Create structured interview scorecards and forms
- Configure interview stages and workflows
- Automate scheduling coordination
- Send interview reminders and confirmations
- Track interviewer availability

### Compliance and Reporting
- Support OFCCP/EEO compliance data collection
- Generate required disposition reports
- Track adverse impact metrics
- Maintain audit trails
- Configure consent and privacy settings

### Pipeline Analytics
- Build talent pipeline reports and metrics dashboards
- Track time-to-fill and time-to-hire
- Monitor source effectiveness
- Analyze conversion rates by stage
- Generate recruiter performance metrics

### Communication Automation
- Automate candidate status tracking
- Configure communication triggers
- Manage email templates
- Schedule follow-up sequences
- Track response rates

## Usage

### Job Requisition Setup
```javascript
const requisition = {
  platform: 'greenhouse',
  job: {
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'Remote - US',
    employmentType: 'Full-time',
    hiringManager: 'manager@company.com',
    description: 'Job description content...',
    requirements: ['5+ years experience', 'Python expertise'],
    compensation: {
      min: 150000,
      max: 200000,
      currency: 'USD'
    }
  },
  workflow: {
    approvers: ['hr@company.com', 'vp@company.com'],
    interviewStages: ['Phone Screen', 'Technical', 'Onsite', 'Final'],
    scorecardTemplate: 'engineering-scorecard'
  }
};
```

### Candidate Pipeline Query
```javascript
const pipelineQuery = {
  requisitionId: 'REQ-12345',
  stages: ['Applied', 'Phone Screen', 'Technical'],
  dateRange: {
    start: '2026-01-01',
    end: '2026-01-24'
  },
  filters: {
    sources: ['LinkedIn', 'Referral'],
    statuses: ['active']
  },
  metrics: ['conversionRate', 'avgTimeInStage', 'sourceEffectiveness']
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| full-cycle-recruiting.js | Requisition management, candidate tracking, scheduling |
| structured-interview-design.js | Scorecard creation, interview workflow |
| employer-branding-strategy.js | Job posting optimization, source tracking |

## Best Practices

1. **Data Standardization**: Ensure consistent field mapping across ATS platforms
2. **Compliance First**: Always enable EEO/OFCCP tracking for regulated employers
3. **Source Attribution**: Configure UTM tracking for accurate source reporting
4. **Workflow Automation**: Set up triggers for time-sensitive communications
5. **Regular Audits**: Review data quality and duplicate records monthly
6. **Integration Testing**: Test API connections before major recruiting campaigns

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Time to Fill | Days from requisition open to offer acceptance | <45 days |
| Application Completion Rate | Started vs. completed applications | >80% |
| Source Quality | Offer rate by source | Track trends |
| Interview-to-Offer Ratio | Interviews conducted per offer made | 4:1 or better |
| Candidate NPS | Candidate experience score | >50 |

## Related Skills

- SK-002: Resume Screening (candidate evaluation)
- SK-003: Interview Questions (scorecard development)
- SK-004: Onboarding Workflow (post-hire handoff)
