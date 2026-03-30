---
name: decision-tree-builder
description: Automated decision tree construction skill for structuring complex decisions with probabilities, payoffs, and expected value calculations
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
    - decision-tree-id3
    - anytree
    - graphviz
    - networkx
---

# Decision Tree Builder

## Overview

The Decision Tree Builder skill provides automated construction and analysis of decision trees for structuring complex business decisions. It enables systematic evaluation of alternatives through probability assignments, payoff calculations, and expected value analysis, supporting both prescriptive decision-making and sensitivity analysis.

## Capabilities

- Decision node and chance node creation
- Probability assignment and validation
- Expected value calculation
- Decision path optimization
- Sensitivity analysis on probabilities
- Rollback analysis automation
- Decision tree visualization generation
- Export to standard formats (JSON, XML)

## Used By Processes

- Structured Decision Making Process
- Multi-Criteria Decision Analysis (MCDA)
- Decision Quality Assessment

## Usage

### Basic Decision Tree Construction

```python
# Define decision structure
decision_tree = {
    "type": "decision",
    "name": "Market Entry Strategy",
    "alternatives": [
        {
            "name": "Enter Now",
            "type": "chance",
            "outcomes": [
                {"name": "High Demand", "probability": 0.6, "payoff": 1000000},
                {"name": "Low Demand", "probability": 0.4, "payoff": -200000}
            ]
        },
        {
            "name": "Wait and See",
            "type": "chance",
            "outcomes": [
                {"name": "Market Grows", "probability": 0.5, "payoff": 600000},
                {"name": "Market Stagnates", "probability": 0.5, "payoff": 100000}
            ]
        }
    ]
}
```

### Expected Value Calculation

The skill calculates expected monetary value (EMV) for each decision path:
- EMV = Sum(probability * payoff) for each chance node
- Optimal decision selected based on maximum EMV

### Sensitivity Analysis

Identify critical probability thresholds where the optimal decision changes:
- One-way sensitivity on individual probabilities
- Two-way sensitivity for correlated probabilities
- Tornado diagrams for parameter importance

### Visualization Output

Generate decision tree diagrams with:
- Clear node labeling (decision squares, chance circles, terminal triangles)
- Probability annotations on branches
- Payoff values at terminal nodes
- Highlighted optimal path

## Input Schema

```json
{
  "decision_name": "string",
  "alternatives": [
    {
      "name": "string",
      "outcomes": [
        {
          "name": "string",
          "probability": "number (0-1)",
          "payoff": "number",
          "nested_decision": "optional object"
        }
      ]
    }
  ],
  "analysis_options": {
    "sensitivity_analysis": "boolean",
    "visualization": "boolean",
    "export_format": "json|xml|png|svg"
  }
}
```

## Output Schema

```json
{
  "optimal_alternative": "string",
  "expected_value": "number",
  "decision_path": ["string"],
  "sensitivity_results": {
    "critical_probabilities": ["object"],
    "tornado_data": ["object"]
  },
  "visualization_path": "string"
}
```

## Best Practices

1. Ensure probabilities at each chance node sum to 1.0
2. Include all reasonably likely outcomes, not just best/worst cases
3. Use consistent monetary units for all payoffs
4. Document assumptions behind probability estimates
5. Perform sensitivity analysis on uncertain probabilities
6. Consider non-monetary values through utility functions when appropriate

## Integration Points

- Connects with Monte Carlo Engine for probability distributions
- Feeds into Decision Visualization for reporting
- Integrates with Bayesian Network Analyzer for probability updates
- Supports Decision Journal for documentation
