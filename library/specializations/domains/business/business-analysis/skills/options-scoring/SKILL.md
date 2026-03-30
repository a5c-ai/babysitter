---
name: options-scoring
description: Multi-criteria decision analysis for solution options with weighted scoring and sensitivity analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-014
  category: Decision Analysis
---

# Options Scoring Calculator

## Overview

The Options Scoring Calculator skill provides specialized capabilities for multi-criteria decision analysis when evaluating solution options. This skill enables objective comparison of alternatives through weighted scoring, sensitivity analysis, and comprehensive recommendation development.

## Capabilities

### Weighted Evaluation Criteria Definition
- Define evaluation criteria with weights
- Validate weight allocation (sum to 100%)
- Group criteria by category
- Apply hierarchical weighting

### Weighted Score Calculation
- Calculate weighted scores across options
- Normalize scores to common scale
- Handle missing data appropriately
- Generate score breakdowns

### Sensitivity Analysis
- Perform sensitivity analysis on weights
- Identify critical criteria affecting outcomes
- Test robustness of rankings
- Generate sensitivity charts

### Comparison Matrix Heat Maps
- Generate comparison matrices with heat maps
- Visualize strengths and weaknesses
- Highlight differentiating factors
- Create spider/radar charts

### Pros/Cons Summaries
- Create structured pros/cons summaries
- Weight significance of each factor
- Generate balanced assessments
- Develop risk-adjusted views

### Feasibility Score Calculation
- Calculate feasibility scores by dimension
- Assess technical feasibility
- Assess operational feasibility
- Assess economic feasibility

### Recommendation Confidence Levels
- Generate recommendation confidence levels
- Factor in analysis limitations
- Consider uncertainty in inputs
- Provide confidence intervals

## Usage

### Define Evaluation Criteria
```
Define evaluation criteria for comparing these options:
[Options description]

Include criteria categories and recommended weights.
```

### Calculate Option Scores
```
Calculate weighted scores for these options:

Criteria and Weights: [Criteria list with weights]
Options: [Option details with ratings]

Generate ranking and score breakdown.
```

### Perform Sensitivity Analysis
```
Perform sensitivity analysis on this evaluation:
[Evaluation results]

Vary weights by +/- 20% and show impact on ranking.
```

### Generate Recommendation
```
Generate a recommendation from this analysis:
[Scored options with analysis]

Include confidence level and key considerations.
```

## Process Integration

This skill integrates with the following business analysis processes:
- solution-options-analysis.js - Core options evaluation
- business-case-development.js - Option comparison for business cases
- requirements-elicitation-workshop.js - Prioritization activities

## Dependencies

- Decision analysis algorithms
- Statistical functions for sensitivity
- Visualization libraries
- Recommendation templates

## Multi-Criteria Decision Analysis Reference

### Weighted Scoring Matrix Template
| Criteria | Weight | Option A | Option B | Option C |
|----------|--------|----------|----------|----------|
| Cost | 30% | 4 (1.2) | 3 (0.9) | 5 (1.5) |
| Quality | 25% | 5 (1.25) | 4 (1.0) | 3 (0.75) |
| Speed | 20% | 3 (0.6) | 5 (1.0) | 4 (0.8) |
| Risk | 15% | 4 (0.6) | 3 (0.45) | 4 (0.6) |
| Fit | 10% | 3 (0.3) | 4 (0.4) | 5 (0.5) |
| **Total** | **100%** | **3.95** | **3.75** | **4.15** |

### Rating Scale
| Score | Description | Guidelines |
|-------|-------------|------------|
| 5 | Excellent | Exceeds all requirements |
| 4 | Good | Meets all requirements well |
| 3 | Acceptable | Meets minimum requirements |
| 2 | Poor | Partially meets requirements |
| 1 | Unacceptable | Does not meet requirements |

### Common Evaluation Criteria Categories
| Category | Example Criteria |
|----------|-----------------|
| Financial | Cost, ROI, TCO, Payback period |
| Technical | Performance, Scalability, Security |
| Operational | Ease of use, Maintenance, Support |
| Strategic | Alignment, Future-proofing, Innovation |
| Risk | Implementation risk, Vendor risk, Technology risk |
| Time | Time to implement, Time to value |

### Feasibility Dimensions
| Dimension | Key Questions |
|-----------|---------------|
| Technical | Can we build/implement it? Do we have the skills? |
| Operational | Can we operate it? Does it fit our processes? |
| Economic | Can we afford it? Is the ROI acceptable? |
| Legal | Does it comply with regulations? |
| Schedule | Can we deliver it in time? |

### Sensitivity Analysis Approach
1. Establish base case with current weights
2. Vary one criterion weight at a time (+/- 20%)
3. Recalculate option scores
4. Identify criteria that change the ranking
5. Report "switching point" weights

### Recommendation Framework
```
RECOMMENDATION: [Option X]

CONFIDENCE LEVEL: [High/Medium/Low]

RATIONALE:
- [Key strength 1]
- [Key strength 2]
- [Key strength 3]

KEY RISKS:
- [Risk 1 with mitigation]
- [Risk 2 with mitigation]

ALTERNATIVES CONSIDERED:
- Option Y: Not recommended because [reason]
- Option Z: Not recommended because [reason]

NEXT STEPS:
1. [Immediate action]
2. [Follow-up action]
```

### Decision Documentation Checklist
- [ ] All options fully described
- [ ] Criteria aligned with objectives
- [ ] Weights agreed by stakeholders
- [ ] Ratings based on evidence
- [ ] Sensitivity analysis completed
- [ ] Risks identified and assessed
- [ ] Recommendation justified
- [ ] Decision authority identified
