---
name: promethee-evaluator
description: PROMETHEE (Preference Ranking Organization Method for Enrichment Evaluation) skill for outranking-based multi-criteria analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: quantitative-analysis
  priority: lower
  tools-libraries:
    - pyDecision
    - pymcdm
    - visual-promethee
---

# PROMETHEE Evaluator

## Overview

The PROMETHEE Evaluator skill implements the Preference Ranking Organization Method for Enrichment Evaluation methodology for multi-criteria decision analysis. It uses outranking relations based on pairwise comparisons of alternatives, allowing for flexible preference modeling through various preference functions.

## Capabilities

- Preference function selection (Usual, U-shape, V-shape, Level, Linear, Gaussian)
- Unicriterion preference degree calculation
- Multicriteria preference index computation
- PROMETHEE I partial ranking
- PROMETHEE II complete ranking
- GAIA plane visualization
- Walking weights sensitivity analysis
- Net flow calculation

## Used By Processes

- Multi-Criteria Decision Analysis (MCDA)
- Vendor Selection Analysis
- Resource Allocation Decisions

## Usage

### Preference Functions

1. **Usual (Type I)**: Binary preference (1 if better, 0 otherwise)
2. **U-shape (Type II)**: Indifference threshold q
3. **V-shape (Type III)**: Linear with preference threshold p
4. **Level (Type IV)**: Combination of q and p thresholds
5. **Linear (Type V)**: Linear between q and p thresholds
6. **Gaussian (Type VI)**: Normal distribution with sigma parameter

### Configuration Example

```python
# Define PROMETHEE configuration
config = {
    "alternatives": ["Alt A", "Alt B", "Alt C", "Alt D"],
    "criteria": [
        {
            "name": "Cost",
            "weight": 0.3,
            "type": "cost",
            "preference_function": "linear",
            "parameters": {"p": 20000, "q": 5000}
        },
        {
            "name": "Quality",
            "weight": 0.4,
            "type": "benefit",
            "preference_function": "gaussian",
            "parameters": {"sigma": 10}
        },
        {
            "name": "Delivery",
            "weight": 0.3,
            "type": "cost",
            "preference_function": "v_shape",
            "parameters": {"p": 5}
        }
    ],
    "performance_matrix": [
        [100000, 85, 12],  # Alt A
        [120000, 92, 8],   # Alt B
        [80000, 78, 15],   # Alt C
        [110000, 88, 10]   # Alt D
    ]
}
```

### Flow Calculations

- **Positive Flow (Phi+)**: How much an alternative outranks others
- **Negative Flow (Phi-)**: How much an alternative is outranked
- **Net Flow (Phi)**: Phi+ - Phi- (used for complete ranking)

### PROMETHEE I vs II

- **PROMETHEE I**: Partial ranking based on Phi+ and Phi- separately (allows incomparabilities)
- **PROMETHEE II**: Complete ranking based on net flow Phi

### GAIA Visualization

The GAIA plane provides:
- 2D projection of criteria and alternatives
- Decision axis showing weight sensitivity
- Clustering of similar alternatives
- Criteria correlation identification

## Input Schema

```json
{
  "alternatives": ["string"],
  "criteria": [
    {
      "name": "string",
      "weight": "number",
      "type": "benefit|cost",
      "preference_function": "usual|u_shape|v_shape|level|linear|gaussian",
      "parameters": "object"
    }
  ],
  "performance_matrix": "2D array of numbers",
  "options": {
    "method": "PROMETHEE_I|PROMETHEE_II",
    "gaia_visualization": "boolean",
    "sensitivity_analysis": "boolean"
  }
}
```

## Output Schema

```json
{
  "ranking": [
    {
      "alternative": "string",
      "rank": "number",
      "phi_plus": "number",
      "phi_minus": "number",
      "phi_net": "number"
    }
  ],
  "outranking_matrix": "2D array",
  "partial_ranking": {
    "preferred_pairs": ["object"],
    "incomparable_pairs": ["object"]
  },
  "gaia_data": {
    "alternative_coordinates": "object",
    "criteria_axes": "object",
    "decision_axis": "object"
  },
  "sensitivity_results": "object"
}
```

## Best Practices

1. Select appropriate preference functions based on criterion characteristics
2. Use PROMETHEE I when incomparabilities are meaningful
3. Set thresholds (p, q) based on domain expertise
4. Analyze GAIA plane for insights beyond rankings
5. Validate results with stakeholders
6. Compare with other MCDA methods for robustness

## Integration Points

- Receives weights from AHP Calculator or Stakeholder Preference Elicitor
- Feeds into Decision Visualization for GAIA planes
- Connects with ELECTRE Comparator for method comparison
- Supports Sensitivity Analyzer for weight robustness testing
