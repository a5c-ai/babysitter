---
name: trade-study
description: Structured skill for conducting engineering trade studies and concept selection
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: design-development
  priority: medium
  phase: 7
  tools-libraries:
    - Decision analysis tools
    - MATLAB
    - Spreadsheets
---

# Trade Study Skill

## Purpose

The Trade Study skill provides structured capabilities for conducting engineering trade studies and concept selection, enabling systematic evaluation of design alternatives against requirements.

## Capabilities

- Trade study framework setup
- Evaluation criteria definition and weighting
- Concept generation support
- Pugh matrix implementation
- Quantitative scoring methods
- Sensitivity analysis
- Decision documentation
- Stakeholder consensus building

## Usage Guidelines

### Trade Study Framework

#### Trade Study Types

| Type | Application | Complexity |
|------|-------------|------------|
| Screening | Eliminate non-viable options | Low |
| Pugh matrix | Comparative evaluation | Medium |
| Weighted scoring | Quantitative ranking | Medium |
| Multi-attribute utility | Complex decisions | High |
| Optimization | Parameter selection | High |

#### Process Overview

```
1. Define objectives and scope
2. Establish evaluation criteria
3. Generate alternatives
4. Collect data for each alternative
5. Score alternatives against criteria
6. Analyze results and sensitivity
7. Make recommendation
8. Document decision
```

### Criteria Development

#### Criteria Categories

| Category | Example Criteria |
|----------|------------------|
| Performance | Power output, efficiency, accuracy |
| Physical | Size, weight, volume |
| Cost | Development cost, unit cost, life cycle cost |
| Schedule | Development time, lead time |
| Risk | Technical risk, schedule risk, cost risk |
| Manufacturability | Complexity, process capability |
| Reliability | MTBF, failure modes, redundancy |
| Maintainability | Access, service intervals, spares |

#### Criteria Weighting

```
Methods for weight assignment:

1. Direct assignment
   - Assign percentages directly
   - Total must equal 100%

2. Pairwise comparison
   - Compare each pair of criteria
   - Calculate weights from preferences

3. Swing weighting
   - Consider range of performance
   - Assign weights based on swing importance

4. AHP (Analytic Hierarchy Process)
   - Structured pairwise comparison
   - Consistency check included
```

### Concept Generation

#### Brainstorming Guidelines

```
1. Define the function to be achieved
2. Generate alternatives without judgment
3. Consider:
   - Prior art and benchmarks
   - Different technologies
   - Component variations
   - Configuration options
4. Combine and refine ideas
5. Screen for feasibility
```

#### Concept Representation

| Method | Detail Level | Use |
|--------|--------------|-----|
| Sketch | Low | Initial brainstorm |
| Block diagram | Low-Medium | Functional layout |
| Layout drawing | Medium | Spatial arrangement |
| CAD model | High | Detailed evaluation |

### Pugh Matrix Method

#### Matrix Setup

```
Pugh Matrix:
- Rows: Evaluation criteria
- Columns: Concept alternatives
- Datum: Baseline or best-known solution
- Scoring: + (better), - (worse), S (same)

| Criteria | Weight | Datum | Alt-A | Alt-B | Alt-C |
|----------|--------|-------|-------|-------|-------|
| Crit 1   | 0.30   | 0     | +     | -     | S     |
| Crit 2   | 0.25   | 0     | S     | +     | +     |
| Crit 3   | 0.20   | 0     | -     | +     | +     |
| Crit 4   | 0.15   | 0     | +     | S     | -     |
| Crit 5   | 0.10   | 0     | S     | +     | S     |
```

#### Results Analysis

```
Calculate for each alternative:
- Sum of positives
- Sum of negatives
- Weighted sum of positives
- Weighted sum of negatives
- Net score

Use results to:
- Eliminate weak concepts
- Identify best features
- Create hybrid concepts
- Iterate evaluation
```

### Weighted Scoring Method

#### Scoring Scale

```
Example 5-point scale:
5 = Excellent, exceeds requirements significantly
4 = Good, exceeds requirements
3 = Acceptable, meets requirements
2 = Marginal, partially meets requirements
1 = Poor, does not meet requirements
0 = Unacceptable, disqualifying

Or numerical scale tied to requirements:
Score = (Performance - Threshold) / (Goal - Threshold)
```

#### Weighted Score Calculation

```
Total Score = Sum(Weight_i x Score_i)

Example:
| Criteria | Weight | Alt-A Score | Alt-A Weighted |
|----------|--------|-------------|----------------|
| Crit 1   | 0.30   | 4           | 1.20           |
| Crit 2   | 0.25   | 3           | 0.75           |
| Crit 3   | 0.20   | 5           | 1.00           |
| Crit 4   | 0.15   | 3           | 0.45           |
| Crit 5   | 0.10   | 4           | 0.40           |
| Total    | 1.00   |             | 3.80           |
```

### Sensitivity Analysis

#### Analysis Methods

```
1. Weight sensitivity
   - Vary weights +/- 10-20%
   - Identify crossover points
   - Determine robust winner

2. Score sensitivity
   - Vary scores +/- 1 point
   - Consider uncertainty in data
   - Identify close decisions

3. Tornado diagram
   - Show impact of each factor
   - Prioritize data improvement
```

### Decision Documentation

#### Trade Study Report

```
Required sections:
1. Executive summary
2. Objectives and scope
3. Evaluation criteria and weights
4. Alternatives description
5. Data sources and assumptions
6. Scoring rationale
7. Results and analysis
8. Sensitivity analysis
9. Recommendation
10. Appendices (detailed data)
```

## Process Integration

- ME-002: Conceptual Design Trade Study

## Input Schema

```json
{
  "study_objective": "string",
  "scope": {
    "system": "string",
    "decision_type": "concept|configuration|supplier|technology"
  },
  "requirements": "array of requirement references",
  "alternatives": [
    {
      "name": "string",
      "description": "string",
      "data_sources": "array"
    }
  ],
  "stakeholders": "array of reviewers",
  "constraints": {
    "budget": "number",
    "schedule": "string",
    "must_meet": "array of requirements"
  }
}
```

## Output Schema

```json
{
  "trade_study_report": {
    "document_number": "string",
    "revision": "string"
  },
  "criteria": [
    {
      "name": "string",
      "weight": "number",
      "rationale": "string"
    }
  ],
  "results": {
    "scoring_matrix": "2D array",
    "weighted_scores": "array",
    "ranking": "array"
  },
  "sensitivity_analysis": {
    "robust_criteria": "array",
    "sensitive_criteria": "array",
    "crossover_points": "array"
  },
  "recommendation": {
    "selected_alternative": "string",
    "rationale": "string",
    "risks": "array",
    "next_steps": "array"
  }
}
```

## Best Practices

1. Define clear objectives before starting
2. Include diverse stakeholder perspectives
3. Document all assumptions and data sources
4. Use consistent scoring across alternatives
5. Perform sensitivity analysis on close decisions
6. Get stakeholder buy-in on recommendation

## Integration Points

- Connects with Requirements Flowdown for evaluation criteria
- Feeds into CAD Modeling for selected concept
- Supports Design Review for decision documentation
- Integrates with Risk assessment for technical risks
