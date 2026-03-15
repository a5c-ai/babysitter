---
name: training-needs
description: Analyze skill gaps and prioritize learning investments across the organization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Learning and Development
  skill-id: SK-009
  dependencies:
    - Competency frameworks
    - Skills taxonomies
---

# Training Needs Assessment Skill

## Overview

The Training Needs Assessment skill provides capabilities for analyzing skill gaps, prioritizing learning investments, and creating training curricula. This skill enables data-driven learning strategy development and ROI measurement.

## Capabilities

### Skills Gap Analysis
- Conduct skills gap analysis by role
- Compare current vs. required proficiency
- Identify critical skill deficiencies
- Prioritize gaps by business impact
- Create individual skill profiles

### Data Aggregation
- Aggregate training needs from multiple data sources
- Integrate performance review data
- Include manager assessment input
- Incorporate employee self-assessment
- Pull external certification requirements

### Investment Prioritization
- Prioritize learning investments by business impact
- Calculate training ROI projections
- Model cost-benefit scenarios
- Compare build vs. buy decisions
- Allocate budget by priority

### Competency Mapping
- Map competencies to training content
- Link learning paths to role requirements
- Connect skills to career progression
- Identify prerequisite relationships
- Track certification requirements

### Curriculum Recommendations
- Generate training curriculum recommendations
- Create role-based learning paths
- Suggest internal vs. external training
- Recommend delivery modalities
- Build blended learning programs

### Visualization and Reporting
- Create skills heat maps by team/department
- Generate executive dashboards
- Build capability matrices
- Track training coverage
- Report on skill development progress

## Usage

### Gap Analysis
```javascript
const analysisConfig = {
  scope: {
    type: 'team',
    id: 'Engineering-Backend'
  },
  competencyFramework: 'engineering-technical-v2',
  assessmentSources: [
    'manager-ratings',
    'self-assessment',
    'performance-review',
    'certification-status'
  ],
  prioritization: {
    weights: {
      businessImpact: 40,
      urgency: 30,
      affectedHeadcount: 20,
      trainingAvailability: 10
    }
  },
  output: {
    heatMap: true,
    gapReport: true,
    recommendations: true
  }
};
```

### Training Plan Generation
```javascript
const trainingPlan = {
  targetRole: 'Senior Software Engineer',
  currentLevel: 'Mid-Level',
  gaps: [
    { skill: 'System Design', currentLevel: 2, targetLevel: 4, priority: 'high' },
    { skill: 'Cloud Architecture', currentLevel: 3, targetLevel: 4, priority: 'medium' },
    { skill: 'Technical Leadership', currentLevel: 2, targetLevel: 3, priority: 'high' }
  ],
  constraints: {
    budget: 5000,
    timeframe: '6 months',
    maxHoursPerWeek: 4
  },
  preferences: {
    modality: ['online', 'blended'],
    certification: true
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| training-needs-analysis.js | Full TNA workflow |
| leadership-development-program.js | Leadership training needs |
| succession-planning.js | Development planning |

## Best Practices

1. **Multiple Data Sources**: Triangulate needs from various inputs
2. **Business Alignment**: Connect training to business outcomes
3. **Manager Involvement**: Include managers in needs identification
4. **Regular Updates**: Refresh analysis at least annually
5. **Measure Impact**: Track skill development post-training
6. **Prioritize Ruthlessly**: Focus on highest-impact gaps

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Gap Coverage | Critical gaps with training available | >90% |
| Training Completion | Enrolled courses completed | >80% |
| Skill Improvement | Pre/post training proficiency gain | >1 level |
| Training ROI | Business value / training cost | >3:1 |
| Time to Proficiency | Days to reach target level | Role-dependent |

## Related Skills

- SK-010: LMS Admin (training delivery)
- SK-006: Performance Review (needs input)
- SK-011: Succession Planning (development alignment)
