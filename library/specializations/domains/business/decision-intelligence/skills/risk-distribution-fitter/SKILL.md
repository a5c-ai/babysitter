---
name: risk-distribution-fitter
description: Probability distribution fitting skill for calibrating uncertainty models from historical data or expert judgment
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
  priority: medium
  tools-libraries:
    - scipy.stats
    - fitter
    - pomegranate
    - distfit
---

# Risk Distribution Fitter

## Overview

The Risk Distribution Fitter skill provides capabilities for calibrating probability distributions from historical data or expert judgment. It supports both data-driven fitting using statistical methods and expert elicitation protocols for subjective probability assessment.

## Capabilities

- Maximum likelihood estimation (MLE)
- Method of moments estimation
- Bayesian parameter estimation
- Goodness-of-fit testing (KS, AD, Chi-square)
- Distribution comparison and selection
- Expert elicitation protocol support (3-point, 5-point)
- PERT distribution calculation
- Visualization of fitted distributions

## Used By Processes

- Monte Carlo Simulation for Decision Support
- Predictive Analytics Implementation
- Decision Quality Assessment

## Usage

### Data-Driven Fitting

```python
# Fit distributions to historical data
fitting_config = {
    "data": [/* historical observations */],
    "candidate_distributions": [
        "normal", "lognormal", "gamma", "weibull",
        "exponential", "beta", "triangular"
    ],
    "fitting_method": "mle",
    "selection_criterion": "AIC"
}
```

### Expert Elicitation

```python
# 3-point estimate (PERT)
expert_estimate = {
    "method": "PERT",
    "minimum": 50000,
    "most_likely": 75000,
    "maximum": 120000,
    "confidence_level": 0.90  # optional: confidence that true value is within range
}

# 5-point estimate (for more precision)
detailed_estimate = {
    "method": "5_point",
    "P10": 45000,
    "P25": 60000,
    "P50": 75000,
    "P75": 95000,
    "P90": 115000
}
```

### Supported Distributions

| Distribution | Use Case | Parameters |
|-------------|----------|------------|
| Normal | Symmetric, unbounded | mean, std |
| Lognormal | Right-skewed, positive | mu, sigma |
| Triangular | Bounded with mode | min, mode, max |
| PERT | Bounded, weighted mode | min, mode, max |
| Uniform | Equal probability | min, max |
| Beta | Bounded, flexible shape | alpha, beta |
| Gamma | Positive, right-skewed | shape, scale |
| Weibull | Reliability/time | shape, scale |
| Exponential | Memoryless | rate |

### Goodness-of-Fit Tests

- **Kolmogorov-Smirnov (KS)**: Distribution-free, sensitive to center
- **Anderson-Darling (AD)**: More sensitive to tails
- **Chi-Square**: Categorical/binned data
- **Cramér-von Mises**: Similar to KS, different weighting

### Model Selection Criteria

- **AIC (Akaike Information Criterion)**: Balance fit and complexity
- **BIC (Bayesian Information Criterion)**: Stronger penalty for parameters
- **Log-Likelihood**: Raw fit quality

## Input Schema

```json
{
  "fitting_mode": "data_driven|expert_elicitation",
  "data_driven_config": {
    "data": ["number"],
    "candidate_distributions": ["string"],
    "fitting_method": "mle|mom|bayesian",
    "selection_criterion": "AIC|BIC|likelihood"
  },
  "expert_elicitation_config": {
    "method": "3_point|5_point|PERT|direct",
    "estimates": "object",
    "confidence_level": "number"
  },
  "options": {
    "gof_tests": ["KS", "AD", "chi_square"],
    "visualize": "boolean",
    "compare_all": "boolean"
  }
}
```

## Output Schema

```json
{
  "best_fit": {
    "distribution": "string",
    "parameters": "object",
    "gof_statistics": {
      "test_name": {
        "statistic": "number",
        "p_value": "number"
      }
    },
    "selection_score": "number"
  },
  "all_fits": [
    {
      "distribution": "string",
      "parameters": "object",
      "scores": "object"
    }
  ],
  "summary": {
    "mean": "number",
    "std": "number",
    "percentiles": "object"
  },
  "visualization_path": "string",
  "recommendations": ["string"]
}
```

## Best Practices

1. Use data-driven fitting when sufficient historical data exists (n > 30)
2. Validate fitted distributions against holdout data
3. Use PERT for expert estimates when asymmetry is expected
4. Document expert credentials and elicitation process
5. Consider mixture distributions for multimodal data
6. Always visualize fitted distribution against data/estimates
7. Use multiple goodness-of-fit tests for robustness

## Expert Elicitation Guidelines

1. Explain probability concepts clearly
2. Use familiar reference points
3. Ask for extreme estimates first, then middle
4. Check for overconfidence (typical: too narrow ranges)
5. Consider debiasing techniques
6. Document reasoning behind estimates

## Integration Points

- Feeds into Monte Carlo Engine for simulation inputs
- Supports Calibration Trainer for expert accuracy assessment
- Connects with Bayesian Network Analyzer for CPT estimation
- Integrates with Risk Register Manager for risk quantification
