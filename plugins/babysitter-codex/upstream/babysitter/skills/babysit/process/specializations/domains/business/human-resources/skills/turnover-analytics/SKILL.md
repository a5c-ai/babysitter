---
name: turnover-analytics
description: Analyze turnover patterns and develop retention strategies with predictive modeling
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
  skill-id: SK-019
  dependencies:
    - HRIS data
    - Statistical models
---

# Turnover Analytics Skill

## Overview

The Turnover Analytics skill provides capabilities for analyzing turnover patterns, building predictive models, and developing data-driven retention strategies. This skill enables comprehensive turnover understanding and proactive intervention.

## Capabilities

### Turnover Calculation
- Calculate turnover rates by segment
- Differentiate voluntary vs. involuntary
- Track regrettable vs. non-regrettable
- Compute annualized rates
- Compare to benchmarks

### Survival Analysis
- Perform survival analysis on tenure
- Build tenure curves by segment
- Identify critical tenure periods
- Calculate hazard rates
- Compare cohort survival

### Predictive Modeling
- Build turnover prediction models
- Identify risk factors
- Calculate flight risk scores
- Validate model accuracy
- Update models with new data

### Risk Identification
- Identify high-risk employees and teams
- Flag at-risk talent segments
- Monitor risk score changes
- Alert managers proactively
- Track intervention effectiveness

### Cost Analysis
- Analyze turnover cost impacts
- Calculate replacement costs
- Estimate productivity loss
- Model cost avoidance
- Support business case

### Intervention Design
- Generate retention intervention recommendations
- Prioritize interventions by impact
- Design targeted programs
- Track retention program effectiveness
- Measure ROI of retention

## Usage

### Turnover Analysis
```javascript
const turnoverAnalysis = {
  period: {
    start: '2025-01-01',
    end: '2026-01-01'
  },
  segments: [
    'department', 'location', 'level', 'tenure-band',
    'performance-rating', 'manager', 'age-group'
  ],
  metrics: [
    'overall-turnover',
    'voluntary-turnover',
    'regrettable-turnover',
    'first-year-turnover'
  ],
  benchmarks: {
    industry: 'technology',
    internal: 'prior-year'
  },
  analysis: {
    survivalCurves: true,
    rootCauses: true,
    costImpact: true
  }
};
```

### Predictive Model
```javascript
const flightRiskModel = {
  target: 'voluntary-termination',
  predictionWindow: 6,
  features: [
    'tenure-months',
    'time-since-promotion',
    'time-since-raise',
    'performance-trend',
    'manager-tenure',
    'commute-distance',
    'market-demand-score',
    'engagement-score',
    'training-hours'
  ],
  model: {
    type: 'logistic-regression',
    crossValidation: 5,
    threshold: 0.7
  },
  output: {
    employeeScores: true,
    riskSegments: ['high', 'medium', 'low'],
    managerAlerts: true
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| turnover-analysis-retention.js | Full analysis workflow |
| workforce-planning.js | Attrition forecasting |
| employee-engagement-survey.js | Engagement correlation |

## Best Practices

1. **Root Cause Focus**: Understand why, not just what
2. **Segment Deeply**: Aggregate metrics hide important patterns
3. **Proactive Action**: Act on predictions before resignations
4. **Manager Enablement**: Equip managers with actionable insights
5. **Privacy Respect**: Handle individual scores carefully
6. **Continuous Learning**: Update models with new data

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Overall Turnover | Annual turnover rate | Below industry benchmark |
| Regrettable Turnover | High performer departures | <10% |
| First-Year Turnover | New hires leaving in year 1 | <15% |
| Model Accuracy | Prediction accuracy (AUC) | >0.75 |
| Intervention Success | Retention rate of intervened employees | +20% vs. control |

## Related Skills

- SK-017: Exit Analysis (departure reasons)
- SK-020: Engagement Survey (engagement link)
- SK-018: Workforce Planning (attrition forecasts)
