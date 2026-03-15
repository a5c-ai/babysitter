---
name: exit-analysis
description: Analyze exit interview data and identify retention insights and patterns
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Employee Relations
  skill-id: SK-017
  dependencies:
    - NLP libraries
    - Exit survey data
---

# Exit Interview Analysis Skill

## Overview

The Exit Interview Analysis skill provides capabilities for analyzing exit interview data to identify retention insights, patterns, and actionable improvements. This skill enables systematic exit data collection, theme analysis, and retention strategy recommendations.

## Capabilities

### Interview Design
- Create exit interview question templates
- Design survey instruments
- Configure voluntary vs. involuntary paths
- Include skip logic and branching
- Support multiple collection methods

### Theme Analysis
- Analyze exit data for themes and patterns
- Apply NLP to open-ended responses
- Cluster related feedback
- Identify emerging issues
- Track theme prevalence

### Turnover Analysis
- Calculate voluntary turnover drivers
- Segment analysis by demographics
- Identify high-risk populations
- Compare regrettable vs. non-regrettable
- Track trends over time

### Departmental Reporting
- Generate department-level exit reports
- Compare managers and teams
- Identify outlier departments
- Create benchmark comparisons
- Support manager feedback

### Issue Identification
- Identify management and culture issues
- Detect compensation concerns
- Surface career development gaps
- Flag work-life balance issues
- Highlight recognition deficits

### Recommendations
- Create retention recommendation reports
- Prioritize interventions
- Estimate impact of changes
- Connect to specific actions
- Track recommendation implementation

## Usage

### Exit Survey Template
```javascript
const exitSurvey = {
  name: 'Standard Exit Survey',
  sections: [
    {
      title: 'Overall Experience',
      questions: [
        {
          type: 'scale',
          text: 'How likely are you to recommend this company as a place to work?',
          scale: { min: 0, max: 10 },
          isNPS: true
        },
        {
          type: 'multiselect',
          text: 'What were your primary reasons for leaving?',
          options: [
            'Compensation', 'Career advancement', 'Management',
            'Work-life balance', 'Company culture', 'Job fit',
            'Relocation', 'Personal reasons', 'Other opportunity'
          ]
        }
      ]
    },
    {
      title: 'Manager Relationship',
      questions: [
        {
          type: 'scale',
          text: 'How would you rate your relationship with your direct manager?',
          scale: { min: 1, max: 5 }
        },
        {
          type: 'openText',
          text: 'What could your manager have done differently?'
        }
      ]
    }
  ]
};
```

### Analysis Configuration
```javascript
const analysisConfig = {
  dateRange: {
    start: '2025-01-01',
    end: '2026-01-24'
  },
  segments: [
    'department', 'manager', 'tenure', 'level', 'performance'
  ],
  themeAnalysis: {
    enabled: true,
    minMentions: 5,
    categories: [
      'compensation', 'management', 'culture', 'growth',
      'workload', 'recognition', 'flexibility'
    ]
  },
  benchmarks: {
    internal: true,
    external: 'industry-benchmark'
  },
  output: {
    executiveSummary: true,
    departmentReports: true,
    trendAnalysis: true,
    recommendations: true
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| employee-exit-offboarding.js | Exit data collection |
| turnover-analysis.js | Retention strategy input |
| employee-engagement-survey.js | Cross-reference engagement |

## Best Practices

1. **Consistency**: Use standardized questions for trending
2. **Timing**: Conduct exit interviews after resignation, before departure
3. **Multiple Channels**: Offer survey and live interview options
4. **Confidentiality**: Aggregate data to protect individuals
5. **Action Loop**: Connect insights to retention actions
6. **Share Results**: Report findings to leadership regularly

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Participation Rate | Exiting employees who complete survey | >80% |
| Regrettable Turnover | High performers leaving | <10% |
| Theme Resolution | Issues addressed after identification | Track |
| Manager Coaching | Managers with exit feedback addressed | 100% |
| Stay Interview Follow-up | Exit insights used proactively | Yes |

## Related Skills

- SK-019: Turnover Analytics (predictive analysis)
- SK-020: Engagement Survey (current employee input)
