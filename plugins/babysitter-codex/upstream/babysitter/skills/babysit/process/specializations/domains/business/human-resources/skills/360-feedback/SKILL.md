---
name: 360-feedback
description: Design, administer, and analyze 360-degree feedback surveys for leadership development
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
  skill-id: SK-007
  dependencies:
    - Survey platforms
    - Statistical analysis tools
---

# 360 Feedback Survey Skill

## Overview

The 360 Feedback Survey skill provides capabilities for designing, administering, and analyzing 360-degree feedback surveys. This skill enables multi-rater feedback collection, blind spot identification, and development-focused insights for leaders and individual contributors.

## Capabilities

### Survey Design
- Generate 360 survey questions by competency
- Create role-specific question sets
- Design rating scales with anchors
- Include open-ended feedback prompts
- Support customization by level

### Rater Configuration
- Configure rater groups and anonymity settings
- Define minimum rater requirements
- Set up self, manager, peer, and direct report categories
- Manage rater nomination workflows
- Handle external stakeholder inclusion

### Score Calculation
- Calculate aggregate scores and distributions
- Compute self-other gaps
- Generate category averages
- Apply statistical significance tests
- Handle small sample considerations

### Insight Generation
- Identify blind spots and hidden strengths
- Detect self-awareness patterns
- Compare to normative data
- Highlight development priorities
- Generate actionable insights

### Report Generation
- Generate individual feedback reports
- Create executive summaries
- Build visual dashboards
- Include verbatim comments (anonymized)
- Provide benchmark comparisons

### Action Planning
- Create development priorities from feedback
- Suggest targeted actions
- Generate IDP recommendations
- Track follow-up commitments
- Support coaching conversations

### Administration
- Track response rates and send reminders
- Monitor completion status
- Manage survey timeline
- Handle confidentiality concerns
- Generate status reports

## Usage

### Survey Configuration
```javascript
const surveyConfig = {
  program: 'Leadership 360 - 2026',
  subject: {
    id: 'EMP-12345',
    level: 'Director',
    role: 'Engineering Director'
  },
  competencies: [
    'Strategic Thinking',
    'Communication',
    'Team Development',
    'Decision Making',
    'Collaboration',
    'Results Orientation'
  ],
  raterGroups: {
    self: { required: true, count: 1 },
    manager: { required: true, count: 1 },
    peers: { required: true, minCount: 3, maxCount: 5 },
    directReports: { required: true, minCount: 3, maxCount: 8 },
    others: { required: false, maxCount: 3 }
  },
  anonymity: {
    minResponsesForCategory: 3,
    combineSmallGroups: true,
    hideVerbatimSource: true
  }
};
```

### Report Generation
```javascript
const reportConfig = {
  subject: 'EMP-12345',
  program: 'Leadership 360 - 2026',
  sections: [
    'executive-summary',
    'competency-scores',
    'self-other-gaps',
    'rater-group-comparison',
    'strengths-and-development',
    'verbatim-comments',
    'action-planning'
  ],
  benchmarks: {
    include: true,
    compareTo: 'company-directors'
  },
  format: 'detailed'
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| 360-degree-feedback-implementation.js | Full 360 workflow |
| leadership-development-program.js | Development input |
| succession-planning.js | Readiness assessment |

## Best Practices

1. **Development Focus**: Use 360 for development, not evaluation
2. **Anonymity Protection**: Maintain strict confidentiality
3. **Rater Training**: Train raters on effective feedback
4. **Manager Preparation**: Prepare managers to support results
5. **Action Planning**: Always follow up with development plans
6. **Frequency**: Conduct no more than annually

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Response Rate | Invited raters who complete | >85% |
| Self-Other Gap | Average difference self vs. others | Track trend |
| Development Follow-up | Subjects with action plans | 100% |
| Rater Quality | Average comment length | >50 words |
| Perception Change | Score improvement over time | Positive trend |

## Related Skills

- SK-006: Performance Review (evaluation integration)
- SK-009: Training Needs (development input)
- SK-011: Succession Planning (readiness data)
