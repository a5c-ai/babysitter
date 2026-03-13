---
name: job-evaluation
description: Analyze and evaluate jobs for internal equity and leveling using point-factor methods
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
  skill-id: SK-012
  dependencies:
    - Job evaluation methodologies
    - Career frameworks
---

# Job Evaluation Skill

## Overview

The Job Evaluation skill provides capabilities for analyzing and evaluating jobs to establish internal equity, create job architecture, and support compensation decisions. This skill enables systematic job leveling through point-factor methods and career framework development.

## Capabilities

### Point-Factor Evaluation
- Apply point-factor job evaluation methods
- Calculate factor weights and scores
- Evaluate jobs consistently
- Handle hybrid and unique roles
- Support multiple evaluation systems (Hay, Mercer IPE)

### Job Architecture
- Create job family and career level frameworks
- Define job family structures
- Establish career ladders
- Create job profiles
- Document leveling criteria

### Internal Equity Analysis
- Calculate internal equity relationships
- Identify pay grade inconsistencies
- Compare job values across departments
- Detect compression issues
- Support equity adjustments

### Job Documentation
- Generate job architecture documentation
- Create job description templates
- Build leveling guides and criteria
- Document evaluation rationale
- Maintain evaluation records

### Market Matching
- Map jobs to market survey matches
- Support benchmark job selection
- Enable custom survey cuts
- Track match quality
- Document matching rationale

## Usage

### Job Evaluation
```javascript
const jobEvaluation = {
  job: {
    title: 'Senior Software Engineer',
    family: 'Engineering',
    department: 'Product Engineering',
    manager: 'Engineering Manager'
  },
  factors: [
    {
      name: 'Knowledge',
      weight: 25,
      subfactors: [
        { name: 'Education', score: 4, maxScore: 6 },
        { name: 'Experience', score: 5, maxScore: 6 },
        { name: 'Technical Complexity', score: 5, maxScore: 6 }
      ]
    },
    {
      name: 'Problem Solving',
      weight: 25,
      subfactors: [
        { name: 'Analysis', score: 5, maxScore: 6 },
        { name: 'Creativity', score: 4, maxScore: 6 }
      ]
    },
    {
      name: 'Impact',
      weight: 30,
      subfactors: [
        { name: 'Scope', score: 4, maxScore: 6 },
        { name: 'Financial Impact', score: 3, maxScore: 6 }
      ]
    },
    {
      name: 'Leadership',
      weight: 20,
      subfactors: [
        { name: 'Direct Reports', score: 1, maxScore: 6 },
        { name: 'Influence', score: 4, maxScore: 6 }
      ]
    }
  ]
};
```

### Career Framework
```javascript
const careerFramework = {
  family: 'Engineering',
  track: 'Individual Contributor',
  levels: [
    {
      code: 'IC1',
      title: 'Associate Engineer',
      pointRange: { min: 100, max: 200 },
      gradeLevel: 'P1',
      characteristics: {
        scope: 'Task-level with guidance',
        autonomy: 'Close supervision',
        impact: 'Own work only'
      }
    },
    {
      code: 'IC2',
      title: 'Software Engineer',
      pointRange: { min: 201, max: 350 },
      gradeLevel: 'P2',
      characteristics: {
        scope: 'Project components',
        autonomy: 'General guidance',
        impact: 'Team contributions'
      }
    }
    // ... additional levels
  ]
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| job-evaluation-leveling.js | Full evaluation workflow |
| salary-benchmarking.js | Market matching |
| succession-planning.js | Career framework |

## Best Practices

1. **Consistency**: Apply evaluation factors consistently across jobs
2. **Documentation**: Document evaluation rationale thoroughly
3. **Committee Review**: Use evaluation committees for objectivity
4. **Regular Updates**: Review job evaluations when roles change
5. **Market Alignment**: Ensure internal values align with market
6. **Transparency**: Communicate leveling criteria to employees

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Jobs Evaluated | Percentage of jobs with evaluation | 100% |
| Evaluation Currency | Jobs reviewed in last 2 years | 100% |
| Internal Equity | Same-level pay variance | <10% |
| Framework Coverage | Jobs mapped to framework | 100% |
| Appeal Rate | Evaluation appeals per year | <5% |

## Related Skills

- SK-013: Comp Benchmarking (market integration)
- SK-014: Pay Equity (equity analysis)
