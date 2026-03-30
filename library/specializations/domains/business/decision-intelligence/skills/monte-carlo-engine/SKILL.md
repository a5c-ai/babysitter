---
name: monte-carlo-engine
description: Monte Carlo simulation engine skill for probabilistic modeling, risk quantification, and uncertainty propagation
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
    - numpy
    - scipy.stats
    - pymc
    - chaospy
    - SALib
---

# Monte Carlo Engine

## Overview

The Monte Carlo Engine skill provides comprehensive probabilistic simulation capabilities for quantifying uncertainty, assessing risk, and propagating variability through complex models. It supports multiple sampling strategies, correlation handling, and statistical analysis of simulation outputs for data-driven decision support.

## Capabilities

- Random variate generation (normal, triangular, PERT, uniform, lognormal, beta, etc.)
- Latin Hypercube Sampling (LHS)
- Correlation structure handling (Cholesky decomposition, copulas)
- Convergence monitoring and adaptive iteration
- Statistical output analysis (mean, variance, percentiles)
- Tornado diagram generation
- Value at Risk (VaR) and CVaR calculation
- Parallel simulation execution

## Used By Processes

- Monte Carlo Simulation for Decision Support
- Strategic Scenario Development
- What-If Analysis Framework
- Predictive Analytics Implementation

## Usage

### Distribution Specification

```python
# Define input distributions
input_variables = {
    "revenue": {
        "distribution": "triangular",
        "parameters": {"min": 800000, "mode": 1000000, "max": 1500000}
    },
    "cost": {
        "distribution": "normal",
        "parameters": {"mean": 600000, "std": 50000}
    },
    "market_share": {
        "distribution": "PERT",
        "parameters": {"min": 0.05, "mode": 0.10, "max": 0.20}
    },
    "unit_price": {
        "distribution": "uniform",
        "parameters": {"min": 45, "max": 55}
    }
}
```

### Correlation Matrix

```python
# Define correlations between variables
correlations = {
    "variables": ["revenue", "cost", "market_share"],
    "matrix": [
        [1.0, 0.6, 0.3],   # revenue correlations
        [0.6, 1.0, 0.2],   # cost correlations
        [0.3, 0.2, 1.0]    # market_share correlations
    ]
}
```

### Model Function

```python
# Define the model to simulate
def profit_model(inputs):
    revenue = inputs["revenue"]
    cost = inputs["cost"]
    profit = revenue - cost
    return {"profit": profit, "margin": profit / revenue}
```

### Sampling Strategies

1. **Simple Random Sampling**: Standard Monte Carlo
2. **Latin Hypercube Sampling**: Better coverage with fewer samples
3. **Quasi-Monte Carlo**: Low-discrepancy sequences (Sobol, Halton)
4. **Importance Sampling**: Focus on tail events

### Convergence Monitoring

The skill monitors:
- Running mean and standard deviation
- Coefficient of variation convergence
- Percentile stability
- Adaptive stopping criteria

## Input Schema

```json
{
  "input_variables": {
    "variable_name": {
      "distribution": "string",
      "parameters": "object"
    }
  },
  "correlations": {
    "variables": ["string"],
    "matrix": "2D array"
  },
  "model": "function or expression",
  "simulation_options": {
    "iterations": "number",
    "sampling_method": "random|lhs|quasi_mc",
    "random_seed": "number",
    "parallel": "boolean",
    "convergence_threshold": "number"
  },
  "output_options": {
    "percentiles": ["number"],
    "risk_metrics": ["VaR", "CVaR"],
    "confidence_level": "number"
  }
}
```

## Output Schema

```json
{
  "summary_statistics": {
    "output_variable": {
      "mean": "number",
      "std": "number",
      "median": "number",
      "min": "number",
      "max": "number",
      "percentiles": "object"
    }
  },
  "risk_metrics": {
    "VaR": "number",
    "CVaR": "number",
    "probability_of_loss": "number"
  },
  "convergence_info": {
    "iterations_run": "number",
    "converged": "boolean",
    "stability_scores": "object"
  },
  "raw_results": "array (optional)",
  "tornado_data": "object",
  "visualization_paths": ["string"]
}
```

## Best Practices

1. Use at least 10,000 iterations for stable percentile estimates
2. Apply Latin Hypercube Sampling for efficiency
3. Validate input distributions with subject matter experts
4. Include correlations for realistic results
5. Monitor convergence before accepting results
6. Perform sensitivity analysis to identify key drivers
7. Document all distribution assumptions

## Integration Points

- Receives distributions from Risk Distribution Fitter
- Feeds into Sensitivity Analyzer for importance analysis
- Supports Value at Risk Calculator for risk metrics
- Connects with Decision Tree Builder for decision node valuation
- Integrates with Real Options Analyzer for option valuation
