---
name: performance-review
description: Generate performance review documentation and facilitate evaluation processes
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
  skill-id: SK-006
  dependencies:
    - Competency models
    - Rating scales
---

# Performance Review Generator Skill

## Overview

The Performance Review Generator skill provides capabilities for creating performance evaluation documentation and facilitating the review process. This skill enables self-assessments, manager evaluations, calibration frameworks, and development planning.

## Capabilities

### Self-Assessment Templates
- Create self-assessment templates by role
- Generate competency-based questions
- Include goal achievement sections
- Add development reflection prompts
- Support evidence documentation

### Manager Evaluation Forms
- Generate manager evaluation forms with competencies
- Create role-specific rating criteria
- Build behaviorally-anchored scales
- Include narrative feedback sections
- Support multi-rater input

### Calibration Support
- Build calibration session frameworks
- Create rating distribution guidelines
- Generate discussion guides
- Support forced ranking exercises
- Track calibration outcomes

### Rating Calculations
- Calculate performance ratings and distributions
- Apply weighting formulas
- Generate calibrated scores
- Track rating history
- Identify rating patterns

### Performance Summaries
- Generate performance summary documents
- Create year-over-year comparisons
- Summarize strengths and development areas
- Document key accomplishments
- Include stakeholder feedback

### Development Planning
- Create development recommendation templates
- Link performance gaps to development actions
- Generate IDP suggestions
- Track development progress
- Connect to learning resources

### Process Management
- Track review completion and deadlines
- Send reminder notifications
- Monitor compliance rates
- Generate status reports
- Manage review cycles

## Usage

### Review Form Generation
```javascript
const reviewConfig = {
  cycle: 'Annual Review 2026',
  employee: {
    id: 'EMP-12345',
    role: 'Senior Engineer',
    department: 'Engineering',
    manager: 'MGR-67890'
  },
  sections: [
    {
      type: 'goal-achievement',
      weight: 40,
      goals: ['Q1-OKR-001', 'Q2-OKR-002', 'Q3-OKR-003', 'Q4-OKR-004']
    },
    {
      type: 'competency-assessment',
      weight: 40,
      competencies: ['Technical Excellence', 'Collaboration', 'Innovation', 'Leadership']
    },
    {
      type: 'values-alignment',
      weight: 20,
      values: ['Customer Focus', 'Integrity', 'Growth Mindset']
    }
  ],
  ratingScale: {
    type: '5-point',
    labels: ['Needs Improvement', 'Developing', 'Meets Expectations', 'Exceeds', 'Exceptional']
  }
};
```

### Calibration Session Setup
```javascript
const calibrationConfig = {
  session: 'Engineering Calibration Q4-2026',
  managers: ['MGR-001', 'MGR-002', 'MGR-003'],
  employees: ['EMP-list'],
  guidelines: {
    distribution: 'recommended',
    targetDistribution: {
      exceptional: 10,
      exceeds: 20,
      meets: 55,
      developing: 10,
      needsImprovement: 5
    }
  },
  discussionFormat: {
    orderBy: 'rating-then-tenure',
    timePerEmployee: 5,
    focusAreas: ['rating-changes', 'promotion-ready', 'development-needed']
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| performance-review-cycle.js | Full review workflow |
| 360-degree-feedback.js | Multi-rater integration |
| performance-improvement-plan.js | Low performer identification |

## Best Practices

1. **Clear Criteria**: Define performance standards before the cycle
2. **Ongoing Feedback**: Reviews should summarize, not surprise
3. **Evidence-Based**: Require examples to support ratings
4. **Calibration**: Always calibrate before finalizing ratings
5. **Development Focus**: Balance evaluation with growth planning
6. **Timeliness**: Complete reviews within defined windows

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Completion Rate | Reviews completed on time | >95% |
| Distribution Health | Alignment with guidelines | Within 5% |
| Feedback Quality | Narrative word count and specificity | >200 words |
| Employee Satisfaction | Survey of process fairness | >70% |
| Development Planning | Employees with IDPs | 100% |

## Related Skills

- SK-005: OKR Management (goal integration)
- SK-007: 360 Feedback (multi-rater input)
- SK-008: PIP Documentation (low performer support)
