---
name: scenario-modeler
description: Monte Carlo simulations for exit scenarios, return distributions
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-024
---

# Scenario Modeler

## Overview

The Scenario Modeler skill provides advanced scenario analysis and Monte Carlo simulations for venture capital return modeling. It enables probabilistic analysis of exit outcomes and return distributions to inform investment decisions and portfolio construction.

## Capabilities

### Exit Scenario Modeling
- Model multiple exit scenarios (IPO, M&A, secondary)
- Assign probabilities to scenarios
- Calculate expected returns across outcomes
- Account for timing variations

### Monte Carlo Simulation
- Run thousands of probabilistic scenarios
- Model parameter distributions
- Generate return distributions
- Calculate confidence intervals

### Sensitivity Analysis
- Identify key value drivers
- Model driver interactions
- Create tornado charts
- Determine break-even assumptions

### Return Distribution Analysis
- Calculate expected IRR and MOIC
- Generate return percentiles
- Model loss probability
- Analyze portfolio-level returns

## Usage

### Model Exit Scenarios
```
Input: Company data, exit assumptions
Process: Build scenarios, assign probabilities
Output: Scenario matrix, expected value
```

### Run Monte Carlo
```
Input: Base assumptions, parameter distributions
Process: Run simulation iterations
Output: Return distribution, percentile analysis
```

### Analyze Sensitivities
```
Input: Base case, key drivers
Process: Calculate driver sensitivities
Output: Sensitivity analysis, tornado chart
```

### Model Portfolio Returns
```
Input: Portfolio of investments, scenarios
Process: Aggregate portfolio outcomes
Output: Portfolio return distribution
```

## Scenario Framework

| Scenario | Probability Range | Typical Multiple |
|----------|-------------------|------------------|
| Home Run | 5-15% | 10x+ |
| Strong Exit | 15-25% | 3-10x |
| Moderate Exit | 20-30% | 1-3x |
| Flat/Write-off | 30-50% | 0-1x |

## Integration Points

- **VC Method Valuation**: Scenario-based valuation
- **Cap Table Modeling**: Ownership under scenarios
- **DCF Analysis**: Probability-weighted DCF
- **Sensitivity Analyst (Agent)**: Support scenario analysis

## Simulation Parameters

| Parameter | Distribution Type |
|-----------|-------------------|
| Exit Multiple | Log-normal |
| Exit Timing | Normal/Triangular |
| Revenue Growth | Normal |
| Market Multiple | Log-normal |
| Dilution | Triangular |

## Best Practices

1. Ground scenarios in historical data
2. Validate probability assumptions
3. Include tail scenarios (both positive and negative)
4. Consider correlation between assumptions
5. Use simulations for insight, not precision
