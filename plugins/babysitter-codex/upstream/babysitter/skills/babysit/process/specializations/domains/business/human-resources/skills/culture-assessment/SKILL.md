---
name: culture-assessment
description: Assess and measure organizational culture using validated frameworks
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Organizational Development
  skill-id: SK-021
  dependencies:
    - Culture frameworks
    - Diagnostic tools
---

# Culture Assessment Skill

## Overview

The Culture Assessment skill provides capabilities for assessing and measuring organizational culture using validated frameworks. This skill enables culture diagnostics, gap analysis between current and desired states, and transformation planning.

## Capabilities

### Assessment Design
- Design culture assessment instruments
- Apply established frameworks (CVF, OCI, Denison)
- Create custom culture dimensions
- Include qualitative components
- Support multi-method assessment

### Framework Application
- Apply Competing Values Framework (CVF)
- Use Organizational Culture Inventory (OCI)
- Implement Denison Culture Model
- Customize frameworks for context
- Map to organizational values

### Gap Analysis
- Analyze current vs. desired culture gaps
- Quantify gap magnitude
- Prioritize gap closure
- Identify misalignment areas
- Compare subcultures

### Diagnostic Reporting
- Identify cultural strengths and barriers
- Generate culture diagnostic reports
- Create visual culture maps
- Compare to benchmarks
- Highlight intervention areas

### Transformation Planning
- Create culture transformation roadmaps
- Define change interventions
- Set transformation milestones
- Identify change champions
- Plan communication strategies

### Progress Tracking
- Track culture change progress
- Measure intervention effectiveness
- Monitor leading indicators
- Report on transformation status
- Celebrate wins

## Usage

### Culture Assessment
```javascript
const cultureAssessment = {
  framework: 'competing-values',
  dimensions: [
    { name: 'Clan', description: 'Collaborative, mentoring, team-oriented' },
    { name: 'Adhocracy', description: 'Creative, entrepreneurial, innovative' },
    { name: 'Market', description: 'Competitive, results-oriented, goal-focused' },
    { name: 'Hierarchy', description: 'Controlled, structured, efficient' }
  ],
  assessment: {
    method: 'survey',
    questions: 'ocai-validated',
    states: ['current', 'preferred']
  },
  scope: {
    level: 'organization',
    departments: 'all',
    levels: 'all'
  },
  demographics: ['department', 'level', 'tenure', 'function'],
  qualitative: {
    focusGroups: true,
    interviews: 'leadership',
    artifacts: 'review'
  }
};
```

### Transformation Roadmap
```javascript
const transformationRoadmap = {
  currentState: {
    dominant: 'Hierarchy',
    scores: { clan: 20, adhocracy: 15, market: 25, hierarchy: 40 }
  },
  desiredState: {
    dominant: 'Adhocracy',
    scores: { clan: 25, adhocracy: 35, market: 25, hierarchy: 15 }
  },
  interventions: [
    {
      area: 'Leadership Behaviors',
      actions: ['Leadership development program', 'Role modeling training'],
      timeline: 'Q1-Q2 2026',
      owners: 'CHRO, L&D'
    },
    {
      area: 'Decision Making',
      actions: ['Decentralize decisions', 'Empower teams'],
      timeline: 'Q2-Q3 2026',
      owners: 'CEO, Department heads'
    },
    {
      area: 'Recognition',
      actions: ['Innovation awards', 'Risk-taking celebration'],
      timeline: 'Q2 2026',
      owners: 'HR, Communications'
    }
  ],
  milestones: [
    { date: '2026-06-30', measure: 'Pulse survey improvement', target: '+5 points' },
    { date: '2026-12-31', measure: 'Full reassessment', target: 'Adhocracy +10 points' }
  ]
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| culture-assessment-transformation.js | Full culture workflow |
| employee-engagement-survey.js | Engagement-culture link |
| leadership-development-program.js | Leadership culture role |

## Best Practices

1. **Use Validated Tools**: Apply established, validated frameworks
2. **Mixed Methods**: Combine quantitative and qualitative approaches
3. **Involve Leaders**: Leadership commitment is essential
4. **Be Patient**: Culture change takes years, not months
5. **Measure Progress**: Track leading indicators
6. **Communicate Consistently**: Regular, honest communication

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Culture Gap | Current vs. desired gap score | Decreasing over time |
| Assessment Participation | Employees completing assessment | >75% |
| Intervention Completion | Planned actions completed | >80% |
| Behavior Change | Observable behavior shifts | Qualitative improvement |
| Subculture Alignment | Variation across departments | Decreasing |

## Related Skills

- SK-020: Engagement Survey (engagement link)
- SK-009: Training Needs (capability building)
- SK-011: Succession Planning (leadership culture)
