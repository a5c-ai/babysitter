---
name: engagement-survey
description: Design, administer, and analyze employee engagement surveys with action planning
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: HR Analytics
  skill-id: SK-020
  dependencies:
    - Survey platforms
    - Statistical analysis
---

# Engagement Survey Skill

## Overview

The Engagement Survey skill provides capabilities for designing, administering, and analyzing employee engagement surveys. This skill enables comprehensive engagement measurement, driver analysis, manager reporting, and action planning.

## Capabilities

### Survey Design
- Create engagement survey instruments
- Design validated question sets
- Include pulse survey options
- Configure demographic questions
- Support multi-language surveys

### Administration
- Configure survey distribution and anonymity
- Manage participation tracking
- Send reminder communications
- Handle confidentiality concerns
- Support multiple survey modes

### Score Calculation
- Calculate engagement scores and benchmarks
- Compute dimension and question scores
- Generate favorability percentages
- Create composite indices
- Apply weighting if needed

### Driver Analysis
- Identify engagement drivers and detractors
- Perform regression-based driver analysis
- Calculate impact scores
- Prioritize focus areas
- Compare driver strength over time

### Manager Reporting
- Generate manager-level action reports
- Create team comparison views
- Maintain minimum response thresholds
- Support drill-down analysis
- Enable year-over-year trending

### Action Planning
- Create action planning templates
- Link results to specific actions
- Track commitment completion
- Monitor action effectiveness
- Share best practices

## Usage

### Survey Configuration
```javascript
const surveyConfig = {
  name: 'Annual Engagement Survey 2026',
  dimensions: [
    {
      name: 'Overall Engagement',
      questions: [
        'I am proud to work for this company',
        'I would recommend this company as a great place to work',
        'I rarely think about looking for a job at another company'
      ]
    },
    {
      name: 'Manager Effectiveness',
      questions: [
        'My manager treats me with respect',
        'My manager provides regular feedback',
        'My manager supports my development'
      ]
    },
    {
      name: 'Growth and Development',
      questions: [
        'I have opportunities to grow my career here',
        'I receive the training I need to do my job well',
        'I can see a clear path for advancement'
      ]
    }
  ],
  scale: {
    type: 'likert-5',
    labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
  },
  demographics: ['department', 'level', 'tenure', 'location'],
  anonymity: {
    minimumResponses: 5,
    hideSmallGroups: true
  }
};
```

### Analysis Configuration
```javascript
const analysisConfig = {
  survey: 'engagement-2026',
  analysis: {
    overall: true,
    byDimension: true,
    byDemographic: true,
    driverAnalysis: true,
    trendAnalysis: true
  },
  benchmarks: {
    internal: ['engagement-2025', 'engagement-2024'],
    external: 'industry-tech'
  },
  reporting: {
    executiveDashboard: true,
    managerReports: { minimumN: 5 },
    heatmaps: true,
    actionPlanning: true
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| employee-engagement-survey.js | Full survey workflow |
| culture-assessment.js | Culture-engagement link |
| turnover-analysis.js | Engagement-turnover correlation |

## Best Practices

1. **Regular Cadence**: Conduct annual surveys with quarterly pulses
2. **Action Focus**: Always follow up with visible action
3. **Manager Enablement**: Train managers to discuss results
4. **Transparency**: Share results broadly
5. **Benchmark Context**: Provide external comparison
6. **Long-term View**: Track trends over time

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Participation Rate | Employees completing survey | >80% |
| Engagement Score | Overall engagement index | Above benchmark |
| Action Completion | Teams with action plans | 100% |
| Trend Direction | Year-over-year change | Improvement |
| Manager Follow-up | Managers discussing results | 100% |

## Related Skills

- SK-021: Culture Assessment (culture input)
- SK-019: Turnover Analytics (engagement-turnover link)
- SK-017: Exit Analysis (disengagement signals)
