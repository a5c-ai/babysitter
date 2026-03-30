---
name: adkar-assessment
description: Assess and track ADKAR change readiness across stakeholder groups with intervention recommendations
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-009
  category: Change Management
---

# ADKAR Assessment

## Overview

The ADKAR Assessment skill provides specialized capabilities for assessing and tracking change readiness using the Prosci ADKAR model. This skill enables systematic evaluation of stakeholder readiness across five change dimensions, identification of barrier points, and generation of targeted intervention recommendations.

## Capabilities

### ADKAR Assessment Questionnaire Generation
- Generate ADKAR assessment questionnaires
- Customize questions by change type
- Create role-specific assessment versions
- Support multiple response formats (Likert, open-ended)

### Stakeholder Group Scoring
- Calculate ADKAR scores by stakeholder group
- Aggregate scores across dimensions
- Compare scores across groups
- Generate score distributions

### Barrier Point Identification
- Identify barrier points in change journey
- Determine first barrier point for each individual
- Analyze pattern of barriers across groups
- Prioritize barrier resolution

### Targeted Intervention Recommendations
- Generate targeted intervention recommendations
- Match interventions to specific barriers
- Create intervention action plans
- Assign intervention ownership

### Progress Tracking Over Time
- Track ADKAR progress over time
- Compare assessments across periods
- Measure improvement velocity
- Forecast readiness achievement dates

### Readiness Heat Maps
- Create readiness heat maps by group
- Visualize ADKAR dimensions across organization
- Highlight critical gaps
- Show progress through color coding

### Benchmarking
- Benchmark against change management standards
- Compare to Prosci best practices
- Assess against industry change success rates
- Identify improvement opportunities

## Usage

### Generate Assessment
```
Generate an ADKAR assessment questionnaire for:
Change Initiative: [Description]
Stakeholder Groups: [List of groups]

Create customized questions for each ADKAR element.
```

### Score Assessment Results
```
Score these ADKAR assessment results:
[Assessment responses by stakeholder]

Calculate scores by dimension and identify barrier points.
```

### Generate Interventions
```
Generate intervention recommendations for these barriers:
[Barrier analysis results]

Create targeted action plans with owners and timelines.
```

### Track Progress
```
Track ADKAR progress between assessments:
Baseline: [Initial scores]
Current: [Current scores]

Show progress trends and forecast completion.
```

## Process Integration

This skill integrates with the following business analysis processes:
- change-readiness-assessment.js - Core readiness assessment
- change-management-strategy.js - Strategy development
- change-adoption-tracking.js - Adoption measurement
- resistance-management.js - Resistance identification and mitigation

## Dependencies

- ADKAR model framework
- Assessment templates and questionnaires
- Scoring algorithms
- Visualization for heat maps

## ADKAR Model Reference

### ADKAR Elements
| Element | Definition | Key Question |
|---------|------------|--------------|
| A - Awareness | Understanding why change is needed | Do they know why? |
| D - Desire | Willingness to participate and support | Do they want to? |
| K - Knowledge | Understanding how to change | Do they know how? |
| A - Ability | Skills and behaviors to implement | Can they do it? |
| R - Reinforcement | Sustaining the change | Will it stick? |

### Barrier Point Concept
The barrier point is the first ADKAR element where an individual scores below the threshold (typically 3 on a 5-point scale). All interventions should focus on resolving the barrier point before moving forward.

### ADKAR Scoring Scale
| Score | Level | Description |
|-------|-------|-------------|
| 5 | Strong | Fully achieved |
| 4 | Good | Mostly achieved |
| 3 | Moderate | Partially achieved (threshold) |
| 2 | Weak | Limited achievement |
| 1 | None | Not achieved |

### Interventions by Element
| Element | Intervention Types |
|---------|-------------------|
| Awareness | Communications, executive messaging, town halls |
| Desire | Coaching, resistance management, WIIFM messaging |
| Knowledge | Training, job aids, demonstrations |
| Ability | Practice, coaching, mentoring, time to practice |
| Reinforcement | Recognition, rewards, measurement, accountability |

### Assessment Timing
| Phase | Assessment Focus |
|-------|-----------------|
| Pre-change | Awareness, Desire baseline |
| During training | Knowledge assessment |
| Post-implementation | Ability assessment |
| Sustainment | Reinforcement assessment |

### Prosci Change Success Factors
1. Active and visible executive sponsorship
2. Dedicated change management resources
3. Structured change management approach
4. Employee engagement and participation
5. Frequent and open communication
6. Integration with project management
7. Middle manager engagement
