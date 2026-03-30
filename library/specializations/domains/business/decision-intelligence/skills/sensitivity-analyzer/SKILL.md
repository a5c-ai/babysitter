---
name: sensitivity-analyzer
description: Sensitivity analysis skill for identifying critical inputs and understanding model behavior under uncertainty
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: simulation
  priority: high
  shared-candidate: true
  tools-libraries:
    - SALib
    - openturns
    - sensitivity
    - numpy
---

# Sensitivity Analyzer

## Overview

The Sensitivity Analyzer skill provides comprehensive capabilities for identifying critical inputs and understanding how model outputs respond to parameter changes. It supports both local (one-at-a-time) and global sensitivity analysis methods, enabling robust decision-making under uncertainty.

## Capabilities

- One-at-a-time (OAT) sensitivity
- Global sensitivity analysis (Sobol indices, Morris screening)
- Tornado diagram generation
- Spider plot creation
- Parameter importance ranking
- Threshold identification
- Breakeven analysis
- Scenario comparison

## Used By Processes

- Monte Carlo Simulation for Decision Support
- Multi-Criteria Decision Analysis (MCDA)
- Prescriptive Analytics and Optimization
- What-If Analysis Framework

## Usage

### One-at-a-Time (OAT) Analysis

```python
# Define OAT analysis
oat_config = {
    "base_case": {
        "price": 100,
        "volume": 10000,
        "cost": 60,
        "fixed_costs": 200000
    },
    "variations": {
        "price": {"range": [-20, 20], "step": 5, "unit": "%"},
        "volume": {"range": [-30, 30], "step": 10, "unit": "%"},
        "cost": {"range": [-15, 15], "step": 5, "unit": "%"},
        "fixed_costs": {"range": [-10, 10], "step": 5, "unit": "%"}
    },
    "output_variable": "profit"
}
```

### Global Sensitivity (Sobol Indices)

```python
# Define Sobol analysis
sobol_config = {
    "parameters": {
        "price": {"bounds": [80, 120], "distribution": "uniform"},
        "volume": {"bounds": [7000, 13000], "distribution": "uniform"},
        "cost": {"bounds": [50, 70], "distribution": "uniform"}
    },
    "sample_size": 10000,
    "calculate_second_order": True
}
```

### Morris Screening

Efficient screening method for many parameters:
- Identifies parameters with negligible effects
- Distinguishes linear vs. non-linear effects
- Detects interaction effects

### Sensitivity Indices

| Index | Meaning |
|-------|---------|
| S1 (First-order) | Direct effect of parameter |
| ST (Total) | Direct + all interaction effects |
| S2 (Second-order) | Pairwise interaction effect |

## Visualization Types

1. **Tornado Diagram**: Horizontal bars showing impact range
2. **Spider Plot**: Lines showing output vs. % change in each input
3. **Scatter Plot**: Output vs. single input with trend line
4. **Sobol Bar Chart**: First-order and total indices comparison
5. **Morris Plot**: Mean vs. standard deviation of elementary effects

## Input Schema

```json
{
  "analysis_type": "OAT|sobol|morris|breakeven",
  "model": "function or expression",
  "parameters": {
    "param_name": {
      "base_value": "number",
      "range": ["number", "number"],
      "distribution": "string"
    }
  },
  "options": {
    "sample_size": "number",
    "output_variable": "string",
    "calculate_interactions": "boolean",
    "confidence_level": "number"
  }
}
```

## Output Schema

```json
{
  "analysis_type": "string",
  "parameter_rankings": [
    {
      "parameter": "string",
      "importance_score": "number",
      "effect_direction": "positive|negative",
      "first_order_index": "number",
      "total_index": "number"
    }
  ],
  "breakeven_points": {
    "parameter": {
      "breakeven_value": "number",
      "current_distance": "number"
    }
  },
  "interactions": [
    {
      "parameters": ["string", "string"],
      "interaction_index": "number"
    }
  ],
  "tornado_data": {
    "parameter": {
      "low_output": "number",
      "high_output": "number",
      "swing": "number"
    }
  },
  "visualization_paths": ["string"]
}
```

## Best Practices

1. Start with Morris screening for many parameters (>10)
2. Use Sobol indices for detailed analysis of top parameters
3. Include parameter correlations when they exist
4. Report confidence intervals for sensitivity indices
5. Consider non-linear effects (total vs. first-order indices)
6. Communicate results using tornado diagrams for executives
7. Document parameter ranges and their justification

## Interpretation Guidelines

### Sobol Index Interpretation

- **High S1, High ST**: Important direct effect
- **Low S1, High ST**: Important through interactions
- **High S1, Low ST-S1**: Few interactions
- **Low ST**: Parameter can be fixed at nominal value

### Breakeven Analysis

Identifies the parameter value where:
- NPV = 0
- Profit = 0
- Decision changes
- Threshold is crossed

## Integration Points

- Receives model from Monte Carlo Engine
- Feeds into Decision Visualization for charts
- Supports MCDA methods for weight sensitivity
- Connects with Real Options Analyzer for volatility impact
