---
name: real-options-analyzer
description: Real options valuation skill for analyzing strategic flexibility and investment timing decisions
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: risk
  priority: lower
  tools-libraries:
    - numpy
    - scipy
    - custom implementations
---

# Real Options Analyzer

## Overview

The Real Options Analyzer skill provides capabilities for valuing strategic flexibility in investment decisions. It extends traditional NPV analysis by quantifying the value of options to defer, expand, contract, abandon, or switch, enabling better decision-making under uncertainty.

## Capabilities

- Option identification and framing
- Binomial tree valuation
- Black-Scholes adaptation
- Monte Carlo option valuation
- Decision tree representation
- Sensitivity to volatility
- Strategic option types (defer, expand, abandon, switch)
- Integration with NPV analysis

## Used By Processes

- Strategic Scenario Development
- What-If Analysis Framework
- Investment Decision Analysis

## Usage

### Option Definition

```python
# Define real option
real_option = {
    "type": "option_to_expand",
    "underlying_project": {
        "name": "Manufacturing Plant Phase 1",
        "base_npv": 5000000,
        "initial_investment": 20000000,
        "volatility": 0.35,  # annual volatility of project value
        "dividend_yield": 0.03  # cash flow yield
    },
    "option_characteristics": {
        "expansion_cost": 15000000,
        "expansion_factor": 1.5,  # 50% capacity increase
        "exercise_window": {"start_year": 2, "end_year": 5},
        "option_type": "American"  # can exercise anytime in window
    },
    "risk_free_rate": 0.05
}
```

### Binomial Tree Valuation

```python
# Binomial tree configuration
binomial_config = {
    "method": "binomial_tree",
    "parameters": {
        "steps": 50,
        "up_factor": "calculated",  # u = exp(sigma * sqrt(dt))
        "down_factor": "calculated",  # d = 1/u
        "risk_neutral_probability": "calculated"
    },
    "outputs": {
        "option_value": True,
        "optimal_exercise_boundary": True,
        "tree_visualization": True
    }
}
```

### Black-Scholes Adaptation

```python
# Black-Scholes configuration
bs_config = {
    "method": "black_scholes",
    "parameters": {
        "current_value": 25000000,  # S: current project value
        "exercise_price": 15000000,  # K: investment to exercise
        "time_to_expiry": 3,  # T: years
        "volatility": 0.35,  # sigma
        "risk_free_rate": 0.05,  # r
        "dividend_yield": 0.03  # q: continuous cash flow yield
    },
    "option_type": "call"  # expansion = call, abandonment = put
}
```

### Monte Carlo Valuation

```python
# Monte Carlo for path-dependent options
monte_carlo_config = {
    "method": "monte_carlo",
    "simulations": 50000,
    "path_model": {
        "type": "geometric_brownian_motion",
        "parameters": {
            "drift": 0.08,
            "volatility": 0.35
        }
    },
    "exercise_strategy": "least_squares_monte_carlo",  # LSM for American options
    "basis_functions": ["laguerre", 3]  # polynomial basis
}
```

## Real Option Types

| Option Type | Description | Analogy |
|-------------|-------------|---------|
| Defer | Wait for better information | Call option |
| Expand | Increase scale if successful | Call option |
| Contract | Reduce scale if unfavorable | Put option |
| Abandon | Exit and recover salvage | Put option |
| Switch | Change inputs/outputs | Portfolio of options |
| Compound | Option on an option | Sequential investment |
| Rainbow | Multiple sources of uncertainty | Multi-asset option |

## Input Schema

```json
{
  "option_type": "defer|expand|contract|abandon|switch|compound",
  "underlying_project": {
    "current_value": "number",
    "volatility": "number",
    "dividend_yield": "number"
  },
  "option_terms": {
    "exercise_price": "number",
    "time_to_expiry": "number",
    "exercise_type": "European|American"
  },
  "valuation_method": "binomial|black_scholes|monte_carlo",
  "parameters": "object",
  "sensitivity_analysis": {
    "variables": ["volatility", "time", "value"],
    "ranges": "object"
  }
}
```

## Output Schema

```json
{
  "option_value": "number",
  "expanded_npv": "number",
  "static_npv": "number",
  "flexibility_value": "number",
  "greeks": {
    "delta": "number",
    "gamma": "number",
    "vega": "number",
    "theta": "number",
    "rho": "number"
  },
  "exercise_boundary": {
    "time": ["number"],
    "critical_value": ["number"]
  },
  "sensitivity": {
    "variable": {
      "values": ["number"],
      "option_values": ["number"]
    }
  },
  "decision_rule": "string",
  "visualization_paths": ["string"]
}
```

## Best Practices

1. Identify all relevant options before valuation
2. Estimate volatility from comparable assets or market data
3. Use American option models for flexible exercise timing
4. Consider interaction between multiple options
5. Validate inputs with sensitivity analysis
6. Communicate option value as "value of flexibility"
7. Compare expanded NPV to traditional NPV for decision support

## Expanded NPV Framework

**Expanded NPV = Static NPV + Option Value**

Decision Rule:
- If Expanded NPV > 0: Proceed (even if Static NPV < 0)
- If Expanded NPV < 0 but Option Value > 0: Consider deferral
- Option Value quantifies the benefit of waiting/flexibility

## Integration Points

- Feeds into Strategic Options Analyst agent
- Connects with Monte Carlo Engine for simulation
- Supports Scenario Planner for strategy valuation
- Integrates with Decision Tree Builder for representation
