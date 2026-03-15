# Prioritization Calculator Skill

## Overview

The Prioritization Calculator skill provides automated scoring and ranking for product prioritization using established frameworks like RICE, ICE, and MoSCoW. It standardizes prioritization decisions across teams and ensures consistent, data-driven feature selection.

## Purpose

Product teams face constant prioritization decisions with limited data and competing stakeholder interests. This skill enables:

- **Objective Scoring**: Apply consistent frameworks to reduce bias
- **Quick Calculations**: Automate score computation for large backlogs
- **Comparative Analysis**: Rank features against each other fairly
- **Capacity Planning**: Match priorities to available resources

## Use Cases

### 1. Quarterly Roadmap Planning
Score and rank features for the next quarter based on strategic fit and capacity.

### 2. Sprint Backlog Prioritization
Quickly prioritize user stories within a sprint using ICE scoring.

### 3. Feature Request Triage
Apply MoSCoW classification to incoming feature requests.

### 4. Resource Allocation
Determine which features fit within available team capacity.

## Processes That Use This Skill

- **RICE Prioritization** (`rice-prioritization.js`)
- **MoSCoW Prioritization** (`moscow-prioritization.js`)
- **Quarterly Roadmap** (`quarterly-roadmap.js`)
- **Feature Definition and PRD** (`feature-definition-prd.js`)

## Supported Frameworks

### RICE Framework

| Component | Description | Scale |
|-----------|-------------|-------|
| Reach | Users affected per quarter | Number |
| Impact | Effect per user | 0.25-3 |
| Confidence | Certainty level | 0.5-1.0 |
| Effort | Work required | Person-weeks |

**Formula**: `(Reach * Impact * Confidence) / Effort`

### ICE Framework

| Component | Description | Scale |
|-----------|-------------|-------|
| Impact | Metric improvement | 1-10 |
| Confidence | Certainty level | 1-10 |
| Ease | Implementation simplicity | 1-10 |

**Formula**: `Impact * Confidence * Ease`

### MoSCoW Framework

| Category | Criteria |
|----------|----------|
| Must Have | Required for launch, no workaround |
| Should Have | Important, workaround exists |
| Could Have | Nice to have, do if time permits |
| Won't Have | Out of scope for this release |

### Weighted Scoring

Custom frameworks with user-defined criteria and weights.

## Input Specification

```json
{
  "features": [
    {
      "id": "FEAT-001",
      "name": "Search improvements",
      "description": "Enhance search with filters",
      "scores": {
        "reach": 10000,
        "impact": 2,
        "confidence": 0.8,
        "effort": 4
      }
    }
  ],
  "config": {
    "framework": "rice",
    "effortUnit": "person_weeks",
    "teamCapacity": 20,
    "customWeights": null
  }
}
```

## Output Specification

```json
{
  "rankings": [
    {
      "rank": 1,
      "id": "FEAT-001",
      "name": "Search improvements",
      "score": 4000,
      "components": {
        "reach": 10000,
        "impact": 2,
        "confidence": 0.8,
        "effort": 4
      },
      "recommendation": "execute"
    }
  ],
  "statistics": {
    "totalFeatures": 15,
    "meanScore": 2450,
    "medianScore": 1800
  },
  "capacityAnalysis": {
    "available": 20,
    "topNFit": 5,
    "totalEffortTopN": 18
  }
}
```

## Workflow

### Phase 1: Data Validation
1. Verify all required fields present
2. Validate score ranges
3. Check for duplicate items
4. Flag missing data

### Phase 2: Score Calculation
1. Apply framework formula
2. Handle edge cases (zero effort, etc.)
3. Calculate confidence intervals

### Phase 3: Ranking Generation
1. Sort by calculated score
2. Apply tie-breaking rules
3. Identify score clusters

### Phase 4: Analysis
1. Generate statistics
2. Run capacity analysis
3. Create recommendations

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `framework` | rice | Scoring framework to use |
| `effortUnit` | person_weeks | Unit for effort measurement |
| `teamCapacity` | null | Available capacity for planning |
| `normalizeScores` | false | Normalize to 0-100 scale |
| `includeConfidenceInterval` | true | Add uncertainty range |

## Integration with Other Skills

- **user-research-synthesis**: Get user impact data for scoring
- **product-analytics**: Pull quantitative reach estimates
- **okr-planning**: Align priorities with OKR objectives
- **roadmap-visualization**: Display prioritized items

## Score Validation Rules

### RICE Validation
```
- reach: Must be positive integer
- impact: Must be 0.25, 0.5, 1, 2, or 3
- confidence: Must be 0.5, 0.8, or 1.0
- effort: Must be positive number > 0
```

### ICE Validation
```
- impact: Must be 1-10
- confidence: Must be 1-10
- ease: Must be 1-10
```

## Best Practices

### 1. Calibrate as a Team
Hold calibration sessions to align on what "high impact" means.

### 2. Update Regularly
Re-score features as new data becomes available.

### 3. Document Assumptions
Record why specific scores were given.

### 4. Use for Direction, Not Absolutes
Scores guide decisions; they don't make them automatically.

### 5. Consider Dependencies
Features with blockers may need adjusted rankings.

## Troubleshooting

### Common Issues

1. **Inflated Scores**: Review confidence ratings; default to 0.5 if unsure
2. **Clustered Rankings**: Add more granularity to impact/reach estimates
3. **Effort Underestimation**: Include all work phases in effort
4. **Missing Data**: Use conservative defaults, flag for review

### Quality Checklist

- [ ] All features have complete scores
- [ ] Effort includes design, dev, QA, launch
- [ ] Confidence reflects actual certainty
- [ ] Reach estimates use real data when available
- [ ] Dependencies are documented

## Examples

### RICE Calculation
```
Feature: Search improvements
- Reach: 10,000 users/quarter
- Impact: 2 (high)
- Confidence: 0.8 (good data)
- Effort: 4 person-weeks

RICE = (10000 * 2 * 0.8) / 4 = 4,000
```

### ICE Calculation
```
Experiment: New CTA color
- Impact: 3 (small metric move)
- Confidence: 5 (50/50)
- Ease: 10 (trivial change)

ICE = 3 * 5 * 10 = 150
```

## References

- [RICE Prioritizer Skill](https://github.com/alirezarezvani/claude-skills)
- [Sprint Prioritizer Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [OKR Cascade Generator](https://github.com/alirezarezvani/claude-skills)
- [Linear MCP Server](https://github.com/cpropster/linear-mcp-server)
- Process: `rice-prioritization.js`, `moscow-prioritization.js`
