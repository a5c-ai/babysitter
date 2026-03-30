---
name: prioritization-calculator
description: Automated calculation and scoring for product prioritization frameworks including RICE, ICE, MoSCoW, and custom weighted scoring. Normalizes scores, validates inputs, and generates priority rankings with confidence intervals.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# Prioritization Calculator Skill

Calculate and validate scores for multiple prioritization frameworks with weighted scoring, normalization, and confidence-adjusted rankings.

## Overview

This skill provides robust calculation engines for popular prioritization frameworks used in product management. It handles score normalization, validation, custom weighting, and generates actionable priority rankings.

## Capabilities

### RICE Scoring
- Calculate Reach, Impact, Confidence, Effort scores
- Normalize across different scale systems
- Apply team capacity adjustments
- Generate confidence-adjusted rankings

### ICE Scoring
- Impact, Confidence, Ease calculations
- Comparative scoring across features
- Quick prioritization for growth experiments
- Sensitivity analysis

### MoSCoW Categorization
- Must-have, Should-have, Could-have, Won't-have classification
- Constraint-based categorization rules
- Dependency-aware sorting
- Release planning integration

### Weighted Scoring
- Custom prioritization frameworks
- Multiple criteria weighting
- Stakeholder preference integration
- Dynamic weight adjustment

### Score Analysis
- Normalize scores across data sources
- Generate priority rankings with intervals
- Identify score clustering and outliers
- Track prioritization changes over time

## Prerequisites

### Input Data Format
```json
{
  "items": [
    {
      "id": "FEAT-001",
      "name": "Feature name",
      "scores": {
        "reach": 5000,
        "impact": 2,
        "confidence": 0.8,
        "effort": 3
      },
      "metadata": {
        "theme": "growth",
        "requestedBy": "sales"
      }
    }
  ],
  "config": {
    "framework": "rice",
    "effortUnit": "person_weeks",
    "teamCapacity": 20
  }
}
```

## Usage Patterns

### RICE Score Calculation
```markdown
## RICE Formula

RICE Score = (Reach * Impact * Confidence) / Effort

### Scale Definitions

**Reach**: Number of users/customers affected per quarter
- Estimate conservatively
- Use data when available

**Impact**: Expected effect on users
| Score | Meaning |
|-------|---------|
| 3 | Massive impact |
| 2 | High impact |
| 1 | Medium impact |
| 0.5 | Low impact |
| 0.25 | Minimal impact |

**Confidence**: How certain are we?
| Score | Meaning |
|-------|---------|
| 1.0 | High confidence - solid data |
| 0.8 | Medium confidence - some data |
| 0.5 | Low confidence - educated guess |

**Effort**: Person-months or person-weeks
- Include all work: design, dev, QA, launch
- Round up for unknowns
```

### RICE Calculation Example
```python
# RICE Score Calculator

def calculate_rice(reach, impact, confidence, effort):
    """
    Calculate RICE score for prioritization.

    Args:
        reach: Users affected per quarter
        impact: Impact score (0.25, 0.5, 1, 2, or 3)
        confidence: Confidence level (0.5, 0.8, or 1.0)
        effort: Person-weeks of effort

    Returns:
        RICE score
    """
    if effort <= 0:
        raise ValueError("Effort must be positive")

    rice_score = (reach * impact * confidence) / effort
    return rice_score

# Example features
features = [
    {"name": "Search improvements", "reach": 10000, "impact": 2, "confidence": 0.8, "effort": 4},
    {"name": "Export to PDF", "reach": 2000, "impact": 1, "confidence": 1.0, "effort": 2},
    {"name": "AI suggestions", "reach": 5000, "impact": 3, "confidence": 0.5, "effort": 8},
]

# Calculate and rank
for feature in features:
    feature["rice_score"] = calculate_rice(
        feature["reach"],
        feature["impact"],
        feature["confidence"],
        feature["effort"]
    )

ranked = sorted(features, key=lambda x: x["rice_score"], reverse=True)
```

### ICE Score Calculation
```markdown
## ICE Formula

ICE Score = Impact * Confidence * Ease

### Scale Definitions (1-10 for each)

**Impact**: How much will this move the metric?
- 10: Massive improvement
- 5: Moderate improvement
- 1: Minimal improvement

**Confidence**: How sure are we it will work?
- 10: Very confident (tested/proven)
- 5: Somewhat confident (similar worked)
- 1: Pure hypothesis

**Ease**: How easy to implement?
- 10: Trivial (hours)
- 5: Moderate (days)
- 1: Complex (weeks+)
```

### ICE Calculation Example
```python
def calculate_ice(impact, confidence, ease):
    """
    Calculate ICE score for growth prioritization.

    Args:
        impact: 1-10 impact on target metric
        confidence: 1-10 confidence level
        ease: 1-10 ease of implementation

    Returns:
        ICE score (1-1000)
    """
    return impact * confidence * ease

# Example experiments
experiments = [
    {"name": "New CTA color", "impact": 3, "confidence": 5, "ease": 10},
    {"name": "Simplified checkout", "impact": 8, "confidence": 7, "ease": 4},
    {"name": "Social proof", "impact": 5, "confidence": 8, "ease": 7},
]

for exp in experiments:
    exp["ice_score"] = calculate_ice(exp["impact"], exp["confidence"], exp["ease"])

ranked = sorted(experiments, key=lambda x: x["ice_score"], reverse=True)
```

### MoSCoW Classification
```markdown
## MoSCoW Framework

### Must Have (M)
- Non-negotiable for launch
- Failure without it is unacceptable
- Core to the value proposition

### Should Have (S)
- Important but not critical
- Workarounds exist
- Next priority after Must

### Could Have (C)
- Nice to have
- Would enhance but not required
- Do if time permits

### Won't Have (W)
- Explicitly out of scope
- Deferred to future
- Agreed not to do now

## Classification Rules

```python
def classify_moscow(item, constraints):
    """
    Classify item into MoSCoW category.

    Args:
        item: Feature/requirement
        constraints: Release constraints

    Returns:
        MoSCoW category
    """
    # Must Have criteria
    if item.is_regulatory or item.blocks_launch:
        return "M"

    # Should Have criteria
    if item.impact_score >= 0.7 and item.fits_budget:
        return "S"

    # Could Have criteria
    if item.impact_score >= 0.4:
        return "C"

    # Won't Have
    return "W"
```
```

### Weighted Scoring Framework
```markdown
## Custom Weighted Scoring

### Define Criteria
| Criterion | Weight | Scale |
|-----------|--------|-------|
| Strategic Alignment | 25% | 1-5 |
| Revenue Impact | 20% | 1-5 |
| Customer Demand | 20% | 1-5 |
| Technical Feasibility | 15% | 1-5 |
| Competitive Pressure | 10% | 1-5 |
| Risk Level (inverse) | 10% | 1-5 |

### Calculation
```python
def weighted_score(item, criteria_weights):
    """
    Calculate weighted prioritization score.

    Args:
        item: Dict with scores for each criterion
        criteria_weights: Dict with weights (must sum to 1.0)

    Returns:
        Weighted score
    """
    total = 0
    for criterion, weight in criteria_weights.items():
        score = item.get(criterion, 0)
        total += score * weight
    return total
```
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const prioritizationTask = defineTask({
  name: 'feature-prioritization',
  description: 'Calculate prioritization scores for features',

  inputs: {
    features: { type: 'array', required: true },
    framework: { type: 'string', default: 'rice' },
    customWeights: { type: 'object', default: null },
    teamCapacity: { type: 'number', default: null }
  },

  outputs: {
    rankedFeatures: { type: 'array' },
    scoreDistribution: { type: 'object' },
    recommendations: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Calculate ${inputs.framework.toUpperCase()} scores`,
      skill: {
        name: 'prioritization-calculator',
        context: {
          operation: 'calculate_scores',
          features: inputs.features,
          framework: inputs.framework,
          customWeights: inputs.customWeights,
          teamCapacity: inputs.teamCapacity
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Output Formats

### Prioritization Report
```markdown
# Feature Prioritization Report

## Framework: RICE
## Date: 2026-01-24
## Team Capacity: 20 person-weeks/quarter

## Rankings

| Rank | Feature | RICE Score | Reach | Impact | Confidence | Effort |
|------|---------|------------|-------|--------|------------|--------|
| 1 | Search improvements | 4000 | 10000 | 2 | 0.8 | 4 |
| 2 | Export to PDF | 1000 | 2000 | 1 | 1.0 | 2 |
| 3 | AI suggestions | 937 | 5000 | 3 | 0.5 | 8 |

## Capacity Analysis

- Total available: 20 person-weeks
- Top 2 features: 6 person-weeks (fits)
- All 3 features: 14 person-weeks (fits)

## Recommendations

1. **Execute**: Search improvements (highest score, proven impact)
2. **Execute**: Export to PDF (high confidence, low effort)
3. **Validate**: AI suggestions (high impact but low confidence - run experiment first)
```

### Score Distribution Analysis
```json
{
  "framework": "rice",
  "items_scored": 15,
  "score_statistics": {
    "mean": 2450,
    "median": 1800,
    "std_dev": 1200,
    "min": 250,
    "max": 5800
  },
  "clusters": [
    {
      "name": "high_priority",
      "threshold": ">3000",
      "count": 3
    },
    {
      "name": "medium_priority",
      "threshold": "1000-3000",
      "count": 7
    },
    {
      "name": "low_priority",
      "threshold": "<1000",
      "count": 5
    }
  ]
}
```

## Best Practices

1. **Consistent Scales**: Use same scale definitions across all scorers
2. **Document Assumptions**: Record how Reach/Impact were estimated
3. **Regular Recalibration**: Update scores as new data arrives
4. **Avoid False Precision**: RICE is for relative ranking, not absolute truth
5. **Consider Dependencies**: Factor in feature dependencies when ranking
6. **Involve Stakeholders**: Get input from multiple perspectives on scores

## Common Pitfalls

1. **Inflated Confidence**: Default to 0.5 if unsure
2. **Optimistic Effort**: Always include QA, documentation, launch time
3. **Double-Counting Reach**: Avoid counting same users multiple times
4. **Gaming Scores**: Facilitate honest scoring discussions

## References

- [RICE Prioritizer Claude Skill](https://github.com/alirezarezvani/claude-skills)
- [Sprint Prioritizer Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [OKR Cascade Generator](https://github.com/alirezarezvani/claude-skills)
- [Linear MCP Server](https://github.com/cpropster/linear-mcp-server)
