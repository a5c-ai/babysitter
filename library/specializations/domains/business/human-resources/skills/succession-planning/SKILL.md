---
name: succession-planning
description: Identify critical roles and develop succession pipelines with readiness assessment
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
  skill-id: SK-011
  dependencies:
    - Talent assessment data
    - Competency models
---

# Succession Planning Skill

## Overview

The Succession Planning skill provides capabilities for identifying critical roles, assessing internal talent readiness, and building leadership pipelines. This skill enables strategic talent planning through 9-box matrices, readiness assessments, and development tracking.

## Capabilities

### Critical Role Mapping
- Map critical roles and succession risk levels
- Calculate role criticality scores
- Identify single points of failure
- Assess vacancy impact
- Track succession coverage

### Candidate Assessment
- Assess internal candidate readiness
- Evaluate performance and potential
- Calculate readiness timelines
- Track development progress
- Compare candidates objectively

### 9-Box Matrix
- Generate 9-box talent matrices
- Plot performance vs. potential
- Categorize talent segments
- Track movement over time
- Generate cohort analytics

### Development Planning
- Create individual development plans
- Link gaps to development actions
- Track plan execution
- Connect to learning resources
- Monitor progress milestones

### Readiness Metrics
- Track succession readiness metrics
- Calculate bench strength
- Monitor pipeline health
- Report coverage gaps
- Trend readiness over time

### Reporting
- Build role-based competency requirements
- Generate succession bench reports
- Create executive dashboards
- Support board reporting
- Maintain confidential succession records

## Usage

### Critical Role Assessment
```javascript
const roleAssessment = {
  role: 'VP of Engineering',
  criticality: {
    factors: {
      businessImpact: 5,
      specializedKnowledge: 4,
      externalScarcity: 4,
      developmentTime: 5
    },
    vacancyRisk: {
      incumbent: {
        retirementYears: 3,
        flightRisk: 'medium'
      }
    }
  },
  currentSuccessors: [
    { id: 'EMP-001', readiness: 'ready-now', developmentPriority: 'low' },
    { id: 'EMP-002', readiness: 'ready-1-2-years', developmentPriority: 'high' },
    { id: 'EMP-003', readiness: 'ready-3-plus-years', developmentPriority: 'medium' }
  ],
  targetBench: {
    readyNow: 1,
    ready1to2: 2,
    emergency: 1
  }
};
```

### 9-Box Analysis
```javascript
const nineBoxConfig = {
  population: {
    scope: 'director-plus',
    department: 'all'
  },
  axes: {
    performance: {
      source: 'latest-review-rating',
      thresholds: [2.5, 3.5]
    },
    potential: {
      source: 'manager-potential-rating',
      thresholds: [2.5, 3.5]
    }
  },
  output: {
    matrix: true,
    distribution: true,
    movementAnalysis: true,
    actionRecommendations: true
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| succession-planning-process.js | Full succession workflow |
| leadership-development-program.js | Development planning |
| performance-review-cycle.js | Performance input |

## Best Practices

1. **Regular Review**: Update succession plans at least annually
2. **Diverse Pipeline**: Ensure diversity in succession candidates
3. **Development Focus**: Succession without development is wishful thinking
4. **Transparency**: Balance confidentiality with candidate development
5. **Board Visibility**: Report on critical role succession to board
6. **Emergency Plans**: Always have emergency successors identified

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Bench Strength | Ready-now successors per critical role | >1 |
| Succession Coverage | Critical roles with identified successors | 100% |
| Internal Fill Rate | Leadership roles filled internally | >70% |
| Diversity Pipeline | Diverse candidates in pipeline | Reflects workforce |
| Development Completion | Successor IDP completion rate | >80% |

## Related Skills

- SK-009: Training Needs (development input)
- SK-007: 360 Feedback (readiness data)
- SK-006: Performance Review (performance data)
