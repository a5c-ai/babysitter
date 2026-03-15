---
name: okr-management
description: Manage OKRs and goal setting with alignment and tracking capabilities
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Performance Management
  skill-id: SK-005
  dependencies:
    - OKR frameworks
    - Progress tracking systems
---

# OKR/Goal Management Skill

## Overview

The OKR/Goal Management skill provides capabilities for creating, cascading, and tracking Objectives and Key Results across organizations. This skill enables SMART goal creation, alignment visualization, and progress monitoring for effective performance management.

## Capabilities

### Goal Creation
- Create SMART goals from natural language descriptions
- Generate measurable key results
- Set appropriate targets and thresholds
- Define scoring methodologies
- Configure goal timeframes

### OKR Cascading
- Cascade organizational OKRs to team and individual levels
- Maintain alignment between levels
- Track parent-child goal relationships
- Visualize goal hierarchies
- Ensure strategic alignment

### Progress Tracking
- Track goal progress and scoring
- Configure check-in frequencies
- Record progress updates
- Calculate attainment percentages
- Generate progress visualizations

### Alignment Analysis
- Identify alignment gaps between levels
- Detect orphaned or misaligned goals
- Suggest alignment corrections
- Measure alignment metrics
- Create alignment reports

### Review and Reporting
- Generate goal review reports
- Create executive summaries
- Build team scorecards
- Track historical trends
- Support retrospective analysis

### Dependency Management
- Create goal dependency visualizations
- Track blocking relationships
- Identify at-risk dependencies
- Manage cross-team coordination
- Alert on dependency issues

## Usage

### OKR Creation
```javascript
const okrConfig = {
  objective: 'Improve customer satisfaction',
  level: 'Team',
  team: 'Customer Success',
  period: 'Q1-2026',
  keyResults: [
    {
      description: 'Increase NPS from 45 to 60',
      startValue: 45,
      targetValue: 60,
      metric: 'NPS Score',
      scoringMethod: 'linear'
    },
    {
      description: 'Reduce average response time from 4h to 2h',
      startValue: 4,
      targetValue: 2,
      metric: 'Hours',
      scoringMethod: 'inverse-linear'
    },
    {
      description: 'Achieve 95% customer retention',
      startValue: 90,
      targetValue: 95,
      metric: 'Percentage',
      scoringMethod: 'linear'
    }
  ],
  parentObjective: 'company-customer-experience-okr-001'
};
```

### Alignment Check
```javascript
const alignmentQuery = {
  scope: 'organization',
  period: 'Q1-2026',
  analysis: {
    checkCascading: true,
    findOrphans: true,
    detectGaps: true,
    measureCoverage: true
  },
  output: {
    report: true,
    visualization: true,
    recommendations: true
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| goal-setting-okr-framework.js | Full OKR workflow |
| performance-review-cycle.js | Goal achievement evaluation |
| succession-planning.js | Development goal tracking |

## Best Practices

1. **Limit Objectives**: 3-5 objectives per level maximum
2. **Measurable KRs**: All key results must be quantifiable
3. **Ambitious Targets**: Set stretch goals (70% attainment is success)
4. **Regular Check-ins**: Weekly or bi-weekly progress updates
5. **Transparency**: Make OKRs visible across the organization
6. **Separation**: Keep OKRs separate from compensation

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Goal Setting Rate | Employees with goals set | 100% |
| Alignment Score | Goals linked to parent objectives | >90% |
| Average Attainment | Mean goal completion percentage | 60-70% |
| Check-in Frequency | Updates per goal per quarter | >6 |
| Goal Quality | Goals meeting SMART criteria | >95% |

## Related Skills

- SK-006: Performance Review (evaluation integration)
- SK-011: Succession Planning (development goals)
