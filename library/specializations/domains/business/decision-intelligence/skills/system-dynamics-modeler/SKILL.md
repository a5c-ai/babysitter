---
name: system-dynamics-modeler
description: System dynamics modeling skill for feedback loop analysis, stock-flow diagrams, and dynamic simulation
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
  priority: lower
  tools-libraries:
    - pysd
    - BPTK-Py
    - simdynamics
---

# System Dynamics Modeler

## Overview

The System Dynamics Modeler skill provides capabilities for building and analyzing system dynamics models to understand complex systems with feedback loops, delays, and non-linear behaviors. It supports causal loop diagramming, stock-flow modeling, and policy testing for strategic decision support.

## Capabilities

- Stock and flow model construction
- Causal loop diagram creation
- Feedback loop identification
- Simulation execution
- Policy testing and comparison
- Equilibrium analysis
- Sensitivity to initial conditions
- Model validation tests

## Used By Processes

- Strategic Scenario Development
- What-If Analysis Framework
- War Gaming and Competitive Response Modeling

## Usage

### Causal Loop Diagram

```python
# Define causal relationships
causal_loops = {
    "variables": [
        "Market Share", "Revenue", "R&D Investment",
        "Product Quality", "Customer Satisfaction", "Word of Mouth"
    ],
    "links": [
        {"from": "Market Share", "to": "Revenue", "polarity": "+"},
        {"from": "Revenue", "to": "R&D Investment", "polarity": "+"},
        {"from": "R&D Investment", "to": "Product Quality", "polarity": "+", "delay": True},
        {"from": "Product Quality", "to": "Customer Satisfaction", "polarity": "+"},
        {"from": "Customer Satisfaction", "to": "Word of Mouth", "polarity": "+"},
        {"from": "Word of Mouth", "to": "Market Share", "polarity": "+"}
    ],
    "loops": [
        {"name": "Growth Engine", "type": "reinforcing", "variables": ["Market Share", "Revenue", "R&D Investment", "Product Quality", "Customer Satisfaction", "Word of Mouth"]}
    ]
}
```

### Stock and Flow Model

```python
# Define stock-flow structure
model = {
    "stocks": {
        "Customers": {
            "initial_value": 1000,
            "inflows": ["customer_acquisition"],
            "outflows": ["customer_churn"]
        },
        "Brand_Awareness": {
            "initial_value": 0.1,
            "inflows": ["marketing_effect"],
            "outflows": ["awareness_decay"]
        }
    },
    "flows": {
        "customer_acquisition": "potential_customers * conversion_rate * Brand_Awareness",
        "customer_churn": "Customers * churn_rate",
        "marketing_effect": "marketing_spend * effectiveness / market_size",
        "awareness_decay": "Brand_Awareness * decay_rate"
    },
    "auxiliaries": {
        "potential_customers": "market_size - Customers",
        "conversion_rate": "base_conversion * (1 + product_quality_factor)"
    },
    "constants": {
        "market_size": 100000,
        "base_conversion": 0.05,
        "churn_rate": 0.02,
        "decay_rate": 0.1,
        "effectiveness": 0.001
    }
}
```

### Simulation Configuration

```python
# Simulation settings
simulation_config = {
    "time_settings": {
        "initial_time": 0,
        "final_time": 120,  # months
        "time_step": 1,
        "save_interval": 1
    },
    "integration_method": "euler|rk4",
    "scenarios": [
        {"name": "Base Case", "parameters": {}},
        {"name": "High Marketing", "parameters": {"marketing_spend": 50000}},
        {"name": "Low Churn", "parameters": {"churn_rate": 0.01}}
    ]
}
```

### Feedback Loop Types

| Type | Behavior | Example |
|------|----------|---------|
| Reinforcing (R) | Exponential growth/decline | Sales -> Revenue -> Marketing -> Sales |
| Balancing (B) | Goal-seeking, oscillation | Inventory -> Orders -> Production -> Inventory |

## Input Schema

```json
{
  "model_type": "causal_loop|stock_flow",
  "model_definition": {
    "stocks": "object",
    "flows": "object",
    "auxiliaries": "object",
    "constants": "object",
    "causal_links": ["object"]
  },
  "simulation_config": {
    "initial_time": "number",
    "final_time": "number",
    "time_step": "number",
    "scenarios": ["object"]
  },
  "analysis_options": {
    "equilibrium_analysis": "boolean",
    "sensitivity_analysis": "boolean",
    "loop_analysis": "boolean"
  }
}
```

## Output Schema

```json
{
  "simulation_results": {
    "time": ["number"],
    "variables": {
      "variable_name": ["number"]
    }
  },
  "scenario_comparison": {
    "scenario_name": {
      "final_values": "object",
      "peak_values": "object",
      "time_to_equilibrium": "number"
    }
  },
  "feedback_loops": [
    {
      "name": "string",
      "type": "reinforcing|balancing",
      "variables": ["string"],
      "dominance_periods": ["object"]
    }
  ],
  "equilibrium_analysis": {
    "stable_points": ["object"],
    "unstable_points": ["object"]
  },
  "visualization_paths": ["string"]
}
```

## Best Practices

1. Start with causal loop diagrams to understand structure
2. Identify dominant feedback loops for each behavior mode
3. Use dimensional analysis to validate equations
4. Test model against historical data when available
5. Perform extreme condition tests (zero, very high values)
6. Document model boundary and assumptions
7. Use sensitivity analysis to identify leverage points

## Policy Analysis

The skill supports policy testing:
- Compare scenarios with different interventions
- Identify unintended consequences
- Test timing and magnitude of interventions
- Analyze policy resistance (counterintuitive behavior)

## Integration Points

- Feeds into Scenario Narrative Generator for storylines
- Connects with Agent-Based Simulator for hybrid models
- Supports Sensitivity Analyzer for leverage point identification
- Integrates with Decision Visualization for time series plots
