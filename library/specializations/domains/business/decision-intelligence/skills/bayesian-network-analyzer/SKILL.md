---
name: bayesian-network-analyzer
description: Bayesian network construction and inference skill for probabilistic reasoning, causal analysis, and belief updating
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
    - pgmpy
    - pomegranate
    - bnlearn
    - pyAgrum
---

# Bayesian Network Analyzer

## Overview

The Bayesian Network Analyzer skill provides comprehensive capabilities for constructing, analyzing, and reasoning with Bayesian networks. It enables probabilistic inference, causal effect estimation, and belief updating based on new evidence, supporting data-driven decision-making under uncertainty.

## Capabilities

- DAG structure learning from data
- Conditional probability table estimation
- Belief propagation and inference
- Causal effect estimation
- Sensitivity to evidence analysis
- What-if scenario evaluation
- Network visualization
- Integration with external data sources

## Used By Processes

- Structured Decision Making Process
- Predictive Analytics Implementation
- Decision Quality Assessment
- Cognitive Bias Debiasing Process

## Usage

### Network Structure Definition

```python
# Define network structure
network_structure = {
    "nodes": [
        {"name": "MarketCondition", "states": ["Favorable", "Unfavorable"]},
        {"name": "CompetitorAction", "states": ["Aggressive", "Passive"]},
        {"name": "ProductSuccess", "states": ["High", "Medium", "Low"]}
    ],
    "edges": [
        {"from": "MarketCondition", "to": "ProductSuccess"},
        {"from": "CompetitorAction", "to": "ProductSuccess"}
    ]
}
```

### Conditional Probability Tables

```python
# Define CPTs
cpts = {
    "MarketCondition": {"Favorable": 0.6, "Unfavorable": 0.4},
    "CompetitorAction": {"Aggressive": 0.3, "Passive": 0.7},
    "ProductSuccess": {
        # P(Success | Market, Competitor)
        ("Favorable", "Passive"): {"High": 0.7, "Medium": 0.2, "Low": 0.1},
        ("Favorable", "Aggressive"): {"High": 0.4, "Medium": 0.4, "Low": 0.2},
        ("Unfavorable", "Passive"): {"High": 0.3, "Medium": 0.4, "Low": 0.3},
        ("Unfavorable", "Aggressive"): {"High": 0.1, "Medium": 0.3, "Low": 0.6}
    }
}
```

### Inference Queries

Supported inference types:
- **Marginal probability**: P(ProductSuccess = High)
- **Conditional probability**: P(ProductSuccess = High | MarketCondition = Favorable)
- **Most probable explanation**: argmax P(all variables | evidence)
- **Maximum a posteriori**: argmax P(query | evidence)

### Structure Learning

Learn network structure from data using:
- Constraint-based methods (PC algorithm, FCI)
- Score-based methods (Hill Climbing, K2)
- Hybrid methods (MMHC)

### Causal Analysis

- Identify causal vs. correlational relationships
- Compute causal effects using do-calculus
- Analyze confounding and mediation

## Input Schema

```json
{
  "network": {
    "nodes": ["object"],
    "edges": ["object"],
    "cpts": "object"
  },
  "query": {
    "type": "marginal|conditional|mpe|map",
    "target_variables": ["string"],
    "evidence": "object"
  },
  "options": {
    "inference_algorithm": "variable_elimination|belief_propagation|sampling",
    "structure_learning": "boolean",
    "visualize": "boolean"
  }
}
```

## Output Schema

```json
{
  "query_result": {
    "probabilities": "object",
    "most_likely_state": "string",
    "confidence": "number"
  },
  "causal_effects": "object",
  "sensitivity": {
    "influential_parameters": ["string"],
    "robustness_score": "number"
  },
  "visualization_path": "string"
}
```

## Best Practices

1. Validate DAG structure for acyclicity
2. Ensure CPT probabilities sum to 1.0 for each parent configuration
3. Use domain expertise to guide structure learning
4. Validate learned structures against known causal relationships
5. Perform sensitivity analysis on uncertain probability estimates
6. Document assumptions behind probability assessments

## Integration Points

- Connects with Decision Tree Builder for integrated decision analysis
- Supports Monte Carlo Engine for sampling-based inference
- Feeds into Decision Visualization for network diagrams
- Integrates with Causal Inference Engine for advanced causal analysis
