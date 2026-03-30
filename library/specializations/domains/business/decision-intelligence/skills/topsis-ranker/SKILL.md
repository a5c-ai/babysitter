---
name: topsis-ranker
description: TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) ranking skill for multi-criteria evaluation
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
  priority: medium
  tools-libraries:
    - pyDecision
    - scikit-mcda
    - numpy
---

# TOPSIS Ranker

## Overview

The TOPSIS Ranker skill implements the Technique for Order of Preference by Similarity to Ideal Solution methodology for multi-criteria decision analysis. It ranks alternatives based on their geometric distance from ideal and anti-ideal solutions, providing intuitive and mathematically sound rankings.

## Capabilities

- Decision matrix normalization (vector, linear, max-min)
- Weighted normalized matrix calculation
- Ideal and anti-ideal solution identification
- Euclidean distance calculation
- Relative closeness coefficient computation
- Alternative ranking generation
- Sensitivity analysis on weights
- Visualization of results

## Used By Processes

- Multi-Criteria Decision Analysis (MCDA)
- Tech Stack Evaluation
- Geographic Market Analysis

## Usage

### Decision Matrix Construction

```python
# Define decision matrix (alternatives x criteria)
decision_matrix = {
    "alternatives": ["Option A", "Option B", "Option C", "Option D"],
    "criteria": ["Cost", "Quality", "Time", "Risk"],
    "values": [
        [100000, 85, 12, 3],   # Option A
        [150000, 92, 8, 2],    # Option B
        [80000, 78, 15, 4],    # Option C
        [120000, 88, 10, 2]    # Option D
    ],
    "weights": [0.3, 0.35, 0.2, 0.15],
    "criteria_type": ["cost", "benefit", "cost", "cost"]  # minimize/maximize
}
```

### Normalization Methods

1. **Vector Normalization**: r_ij = x_ij / sqrt(sum(x_ij^2))
2. **Linear Normalization**: r_ij = x_ij / max(x_j) for benefit, min(x_j) / x_ij for cost
3. **Max-Min Normalization**: r_ij = (x_ij - min) / (max - min)

### TOPSIS Algorithm Steps

1. Construct normalized decision matrix
2. Calculate weighted normalized matrix
3. Determine ideal (A+) and anti-ideal (A-) solutions
4. Calculate separation measures (S+ and S-)
5. Calculate relative closeness coefficient (C*)
6. Rank alternatives by C* (higher is better)

### Relative Closeness

C* = S- / (S+ + S-)
- C* = 1: Alternative is ideal solution
- C* = 0: Alternative is anti-ideal solution

## Input Schema

```json
{
  "decision_matrix": {
    "alternatives": ["string"],
    "criteria": ["string"],
    "values": "2D array of numbers",
    "weights": ["number"],
    "criteria_type": ["benefit|cost"]
  },
  "options": {
    "normalization_method": "vector|linear|max_min",
    "sensitivity_analysis": "boolean",
    "visualization": "boolean"
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
      "closeness_coefficient": "number",
      "distance_to_ideal": "number",
      "distance_to_anti_ideal": "number"
    }
  ],
  "ideal_solution": "object",
  "anti_ideal_solution": "object",
  "sensitivity_results": {
    "weight_sensitivity": "object",
    "rank_stability": "object"
  },
  "visualization_path": "string"
}
```

## Best Practices

1. Ensure all criteria are on comparable scales or use appropriate normalization
2. Validate that weights sum to 1.0
3. Correctly identify benefit vs. cost criteria
4. Perform sensitivity analysis when alternatives are closely ranked
5. Consider using with AHP for systematic weight derivation
6. Document criteria definitions and measurement methods

## Advantages

- Intuitive geometric interpretation
- Accounts for both best and worst performance
- Works with any number of criteria and alternatives
- Computationally efficient
- Results are easy to explain to stakeholders

## Limitations

- Assumes linear trade-offs between criteria
- Sensitive to weight assignments
- Does not handle uncertainty in input values directly

## Integration Points

- Receives weights from AHP Calculator
- Feeds into Decision Visualization for ranking charts
- Connects with Sensitivity Analyzer for robustness testing
- Integrates with Stakeholder Preference Elicitor for weight collection
