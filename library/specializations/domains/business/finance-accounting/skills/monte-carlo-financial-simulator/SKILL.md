---
name: monte-carlo-financial-simulator
description: Stochastic simulation skill for financial modeling with probability distributions and risk quantification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: financial-modeling
  priority: medium
  shared: true
---

# Monte Carlo Financial Simulator

## Overview

The Monte Carlo Financial Simulator skill enables probabilistic financial modeling through stochastic simulation. It generates thousands of scenarios based on probability distributions to quantify risk and uncertainty in financial forecasts and valuations.

## Capabilities

### Probability Distribution Fitting
- Normal distribution fitting
- Lognormal distribution for positive values
- Triangular distribution for expert estimates
- PERT distribution modeling
- Custom distribution creation
- Historical data-based fitting

### Correlation Matrix Handling
- Variable correlation specification
- Cholesky decomposition for correlated sampling
- Copula implementation
- Rank correlation (Spearman)
- Correlation stability testing
- Partial correlation analysis

### Convergence Analysis
- Sample size determination
- Convergence testing
- Precision metrics calculation
- Stopping criteria implementation
- Result stability verification
- Computational efficiency optimization

### Value at Risk (VaR) Calculation
- Parametric VaR
- Historical simulation VaR
- Monte Carlo VaR
- Expected shortfall (CVaR)
- Marginal VaR
- Incremental VaR

### Confidence Interval Generation
- Percentile-based intervals
- Bootstrap confidence intervals
- Prediction intervals
- Tolerance intervals
- One-sided bounds
- Joint confidence regions

### Crystal Ball/ModelRisk Integration
- @RISK compatibility
- Crystal Ball formula support
- Model export capabilities
- Simulation result import
- Assumption synchronization
- Report generation

## Usage

### Risk Quantification
```
Input: Key uncertain variables, probability distributions, correlations
Process: Run simulations, aggregate results, calculate risk metrics
Output: Probability distributions of outcomes, VaR, confidence intervals
```

### Scenario Probability
```
Input: Model structure, variable ranges, target outcomes
Process: Simulate scenarios, identify conditions for targets
Output: Probability of achieving targets, key driver sensitivity
```

## Integration

### Used By Processes
- Financial Modeling and Scenario Planning
- Cash Flow Forecasting and Liquidity Management
- Foreign Exchange Risk Management

### Tools and Libraries
- numpy
- scipy.stats
- Monte Carlo libraries
- Crystal Ball
- @RISK

### Cross-Specialization Use
- Data Science/ML: Risk analysis
- Insurance: Actuarial modeling
- Engineering: Project risk assessment

## Best Practices

1. Validate distribution assumptions against historical data
2. Test correlation stability across market conditions
3. Ensure sufficient iterations for convergence
4. Document distribution selection rationale
5. Perform sensitivity analysis on distribution parameters
6. Compare results with analytical solutions where possible
