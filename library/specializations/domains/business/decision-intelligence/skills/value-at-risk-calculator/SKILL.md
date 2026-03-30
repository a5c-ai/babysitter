---
name: value-at-risk-calculator
description: Value at Risk (VaR) and related risk metrics calculation skill for financial and operational risk assessment
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
  priority: medium
  tools-libraries:
    - scipy.stats
    - numpy
    - arch
    - riskfolio-lib
---

# Value at Risk Calculator

## Overview

The Value at Risk Calculator skill provides comprehensive capabilities for calculating VaR and related risk metrics using multiple methodologies. It supports financial risk assessment, operational risk quantification, and regulatory compliance through parametric, historical, and simulation-based approaches.

## Capabilities

- Historical simulation VaR
- Parametric VaR (variance-covariance)
- Monte Carlo VaR
- Conditional VaR (CVaR/Expected Shortfall)
- Incremental and component VaR
- Stress testing
- Backtesting and validation
- Regulatory reporting support

## Used By Processes

- Monte Carlo Simulation for Decision Support
- Risk Assessment
- Decision Quality Assessment

## Usage

### Historical Simulation VaR

```python
# Historical VaR configuration
historical_var_config = {
    "method": "historical_simulation",
    "data": {
        "returns": portfolio_returns,  # historical return series
        "period": "daily",
        "history_length": 252  # 1 year of trading days
    },
    "confidence_levels": [0.95, 0.99],
    "holding_period": 1,  # days
    "options": {
        "age_weighting": {
            "enabled": True,
            "decay_factor": 0.97
        }
    }
}
```

### Parametric VaR

```python
# Parametric (variance-covariance) VaR
parametric_var_config = {
    "method": "parametric",
    "portfolio": {
        "positions": {
            "Asset_A": {"value": 1000000, "weight": 0.4},
            "Asset_B": {"value": 750000, "weight": 0.3},
            "Asset_C": {"value": 750000, "weight": 0.3}
        }
    },
    "parameters": {
        "volatilities": {"Asset_A": 0.20, "Asset_B": 0.15, "Asset_C": 0.25},
        "correlation_matrix": [
            [1.0, 0.3, 0.2],
            [0.3, 1.0, 0.5],
            [0.2, 0.5, 1.0]
        ]
    },
    "confidence_level": 0.99,
    "holding_period": 10  # days
}
```

### Monte Carlo VaR

```python
# Monte Carlo VaR configuration
monte_carlo_var_config = {
    "method": "monte_carlo",
    "simulations": 100000,
    "model": {
        "type": "geometric_brownian_motion",
        "parameters": {
            "drift": "historical",
            "volatility": "garch"
        }
    },
    "portfolio_valuation": "full_revaluation",
    "confidence_levels": [0.95, 0.99],
    "holding_period": 10
}
```

### Conditional VaR (Expected Shortfall)

CVaR represents the expected loss given that VaR is exceeded:
- CVaR at 95% = Average loss in worst 5% of scenarios
- Required by Basel III/IV for market risk capital
- More coherent risk measure than VaR

### Stress Testing

```python
# Stress test scenarios
stress_tests = {
    "scenarios": [
        {
            "name": "2008 Financial Crisis",
            "shocks": {"equity": -0.40, "credit_spreads": 0.03, "rates": -0.02}
        },
        {
            "name": "COVID-19 March 2020",
            "shocks": {"equity": -0.30, "volatility": 0.50, "credit_spreads": 0.02}
        },
        {
            "name": "Interest Rate Spike",
            "shocks": {"rates": 0.03, "equity": -0.15}
        }
    ],
    "output": ["portfolio_loss", "position_contributions"]
}
```

## Input Schema

```json
{
  "method": "historical|parametric|monte_carlo",
  "portfolio": {
    "positions": "object",
    "total_value": "number"
  },
  "data": {
    "returns": "array or path",
    "period": "string"
  },
  "parameters": {
    "confidence_levels": ["number"],
    "holding_period": "number",
    "volatility_model": "string"
  },
  "stress_testing": {
    "scenarios": ["object"]
  },
  "backtesting": {
    "enabled": "boolean",
    "test_period": "string"
  }
}
```

## Output Schema

```json
{
  "var_results": {
    "confidence_level": {
      "VaR": "number",
      "VaR_percent": "number",
      "CVaR": "number",
      "CVaR_percent": "number"
    }
  },
  "component_var": {
    "position": {
      "marginal_var": "number",
      "component_var": "number",
      "contribution_percent": "number"
    }
  },
  "stress_test_results": {
    "scenario_name": {
      "portfolio_loss": "number",
      "loss_percent": "number"
    }
  },
  "backtesting": {
    "exceptions": "number",
    "exception_rate": "number",
    "traffic_light": "green|yellow|red",
    "kupiec_test": "object",
    "christoffersen_test": "object"
  },
  "risk_attribution": "object"
}
```

## Best Practices

1. Use multiple methods and compare results
2. Validate with backtesting regularly
3. Include fat tails (t-distribution or historical for parametric)
4. Update parameters (volatility, correlations) frequently
5. Complement VaR with stress testing
6. Report CVaR alongside VaR for tail risk
7. Document all assumptions and limitations

## VaR Interpretation

| Metric | Meaning |
|--------|---------|
| VaR 95% = $1M | 95% confident loss won't exceed $1M |
| CVaR 95% = $1.5M | If loss exceeds VaR, average loss is $1.5M |
| Incremental VaR | Change in portfolio VaR from adding position |
| Component VaR | Position's contribution to total VaR |

## Backtesting Standards

| Exceptions (250 days) | Zone | Interpretation |
|----------------------|------|----------------|
| 0-4 | Green | Model is acceptable |
| 5-9 | Yellow | Model may have issues |
| 10+ | Red | Model needs review |

## Integration Points

- Receives simulations from Monte Carlo Engine
- Connects with Risk Register Manager for risk assessment
- Supports Risk Analyst agent
- Integrates with Decision Visualization for risk charts
