---
name: pay-equity
description: Statistical analysis of compensation for equity and regulatory compliance
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Compensation and Benefits
  skill-id: SK-014
  dependencies:
    - Statistical libraries
    - Compensation data
---

# Pay Equity Analysis Skill

## Overview

The Pay Equity Analysis skill provides capabilities for statistical analysis of compensation to identify and address pay disparities. This skill enables regression-based analysis, gap identification, remediation planning, and regulatory compliance reporting.

## Capabilities

### Regression Analysis
- Perform regression-based pay equity analysis
- Apply multiple regression methodologies
- Control for legitimate pay factors
- Handle multicollinearity issues
- Support various model specifications

### Gap Identification
- Identify statistically significant pay gaps
- Calculate adjusted and unadjusted pay gaps
- Analyze gaps by protected class
- Detect intersectional disparities
- Quantify gap magnitudes

### Remediation Planning
- Generate remediation recommendations
- Calculate remediation costs
- Prioritize remediation approaches
- Model remediation scenarios
- Track remediation progress

### Reporting
- Create pay equity reports for leadership
- Generate board-level summaries
- Build compliance documentation
- Support external reporting requirements
- Maintain audit trails

### Trend Monitoring
- Monitor pay equity trends over time
- Track gap closure progress
- Alert on emerging disparities
- Compare year-over-year results
- Benchmark against industry

### Compliance Support
- Support regulatory compliance (EEOC, state laws)
- Generate required reports
- Document analysis methodology
- Prepare for potential audits
- Track legislative changes

## Usage

### Equity Analysis
```javascript
const equityAnalysis = {
  population: {
    scope: 'full-company',
    excludeNew: true,
    newHireThreshold: 6
  },
  dependentVariable: 'base_salary',
  protectedClasses: ['gender', 'race_ethnicity', 'age'],
  legitimateFactors: [
    'job_level',
    'job_family',
    'years_experience',
    'tenure',
    'performance_rating',
    'location_tier'
  ],
  methodology: {
    type: 'multiple-regression',
    robustnessChecks: true,
    outlierTreatment: 'winsorize',
    significanceLevel: 0.05
  },
  intersectionality: {
    analyze: true,
    combinations: [['gender', 'race_ethnicity']]
  }
};
```

### Remediation Model
```javascript
const remediation = {
  analysis: 'equity-analysis-2026-01',
  approach: 'bring-to-predicted',
  constraints: {
    maxIndividualAdjustment: 10,
    totalBudget: 500000
  },
  prioritization: {
    method: 'largest-gap-first',
    protectedClassPriority: ['gender', 'race_ethnicity']
  },
  implementation: {
    timing: 'merit-cycle',
    communication: 'manager-led'
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| pay-equity-analysis.js | Full analysis workflow |
| salary-benchmarking.js | Market data integration |
| grievance-handling.js | Individual equity concerns |

## Best Practices

1. **Regular Analysis**: Conduct pay equity analysis at least annually
2. **Proactive Approach**: Address gaps before they become complaints
3. **Consistent Methodology**: Use defensible statistical methods
4. **Documentation**: Document methodology and decisions
5. **Legal Review**: Involve legal counsel in sensitive situations
6. **Holistic View**: Consider total compensation, not just base

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Unadjusted Gap | Raw pay difference | Track and reduce |
| Adjusted Gap | Controlled pay difference | Not statistically significant |
| Remediation Completion | Identified gaps addressed | 100% |
| Trend Direction | Year-over-year gap change | Decreasing |
| Compliance Status | Regulatory requirement status | Compliant |

## Related Skills

- SK-012: Job Evaluation (job grouping)
- SK-013: Comp Benchmarking (market context)
- SK-022: Employment Compliance (legal guidance)
