---
name: ahp-calculator
description: Analytic Hierarchy Process (AHP) calculation skill for pairwise comparison matrices, consistency checking, and weight derivation
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
  priority: high
  tools-libraries:
    - ahpy
    - pyDecision
    - scipy.linalg
---

# AHP Calculator

## Overview

The AHP Calculator skill implements the Analytic Hierarchy Process methodology for multi-criteria decision analysis. It enables systematic evaluation of alternatives through pairwise comparisons, consistency validation, and weight derivation, supporting both individual and group decision-making scenarios.

## Capabilities

- Pairwise comparison matrix creation
- Eigenvalue-based weight calculation
- Consistency ratio computation
- Inconsistency identification and correction guidance
- Group AHP aggregation (AIJ/AIP methods)
- Sensitivity analysis on weights
- AHP hierarchy visualization
- Report generation

## Used By Processes

- Multi-Criteria Decision Analysis (MCDA)
- Structured Decision Making Process
- Decision Quality Assessment

## Usage

### AHP Scale

The standard Saaty scale for pairwise comparisons:
- 1: Equal importance
- 3: Moderate importance
- 5: Strong importance
- 7: Very strong importance
- 9: Extreme importance
- 2, 4, 6, 8: Intermediate values

### Hierarchy Definition

```python
# Define AHP hierarchy
hierarchy = {
    "goal": "Select Best Vendor",
    "criteria": [
        {
            "name": "Cost",
            "sub_criteria": ["Initial Cost", "Maintenance Cost"]
        },
        {
            "name": "Quality",
            "sub_criteria": ["Product Quality", "Service Quality"]
        },
        {
            "name": "Delivery",
            "sub_criteria": ["Lead Time", "Reliability"]
        }
    ],
    "alternatives": ["Vendor A", "Vendor B", "Vendor C"]
}
```

### Pairwise Comparison Matrix

```python
# Criteria comparison matrix
criteria_comparison = {
    "Cost": {"Cost": 1, "Quality": 3, "Delivery": 5},
    "Quality": {"Cost": 1/3, "Quality": 1, "Delivery": 3},
    "Delivery": {"Cost": 1/5, "Quality": 1/3, "Delivery": 1}
}
```

### Consistency Analysis

The skill calculates:
- **Consistency Index (CI)**: (lambda_max - n) / (n - 1)
- **Consistency Ratio (CR)**: CI / RI (Random Index)
- **Acceptable threshold**: CR < 0.10

### Group Decision Making

Aggregation methods supported:
- **AIJ (Aggregation of Individual Judgments)**: Geometric mean of individual comparisons
- **AIP (Aggregation of Individual Priorities)**: Geometric mean of derived weights

## Input Schema

```json
{
  "hierarchy": {
    "goal": "string",
    "criteria": ["object"],
    "alternatives": ["string"]
  },
  "comparisons": {
    "criteria": "matrix",
    "sub_criteria": "object of matrices",
    "alternatives": "object of matrices"
  },
  "options": {
    "aggregation_method": "AIJ|AIP",
    "consistency_threshold": "number",
    "sensitivity_analysis": "boolean"
  }
}
```

## Output Schema

```json
{
  "weights": {
    "criteria": "object",
    "sub_criteria": "object",
    "alternatives": "object"
  },
  "global_weights": "object",
  "ranking": ["string"],
  "consistency": {
    "CR": "number",
    "is_consistent": "boolean",
    "inconsistent_comparisons": ["object"]
  },
  "sensitivity": {
    "critical_criteria": ["string"],
    "stability_intervals": "object"
  }
}
```

## Best Practices

1. Limit criteria to 7-9 items per level (cognitive limit)
2. Always check consistency ratio before proceeding
3. Revisit inconsistent comparisons with stakeholders
4. Use geometric mean for group aggregation
5. Perform sensitivity analysis on close rankings
6. Document rationale for each pairwise comparison

## Correction Guidance

When CR > 0.10, the skill identifies:
- Most inconsistent judgments
- Suggested adjustment directions
- Impact of corrections on final weights

## Integration Points

- Connects with Stakeholder Preference Elicitor for data collection
- Feeds into TOPSIS Ranker for hybrid analysis
- Supports Decision Visualization for hierarchy diagrams
- Integrates with Consistency Validator for quality assurance
