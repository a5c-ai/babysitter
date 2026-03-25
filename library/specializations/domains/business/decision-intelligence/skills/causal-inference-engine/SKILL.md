---
name: causal-inference-engine
description: Causal inference skill for estimating treatment effects and understanding causal relationships in business data
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: forecasting
  priority: medium
  shared-candidate: true
  tools-libraries:
    - econml
    - dowhy
    - causalml
    - statsmodels
---

# Causal Inference Engine

## Overview

The Causal Inference Engine skill provides sophisticated methods for estimating causal effects from observational data. It enables business analysts to move beyond correlation to understand true cause-and-effect relationships, supporting evidence-based decision-making for interventions, policy changes, and strategic initiatives.

## Capabilities

- Propensity score matching
- Inverse probability weighting
- Difference-in-differences
- Instrumental variables
- Regression discontinuity
- Synthetic control methods
- Causal forest implementation
- Sensitivity analysis to unobserved confounding

## Used By Processes

- A/B Testing and Experimentation Framework
- Predictive Analytics Implementation
- Win/Loss Analysis Program

## Usage

### Problem Definition

```python
# Define causal question
causal_problem = {
    "treatment": "marketing_campaign",
    "outcome": "purchase_conversion",
    "confounders": ["customer_segment", "prior_purchases", "channel", "region"],
    "instruments": ["random_assignment_probability"],  # if available
    "effect_type": "ATE",  # Average Treatment Effect
    "heterogeneity": ["customer_segment", "tenure"]  # for CATE
}
```

### Propensity Score Matching

```python
# Propensity score configuration
psm_config = {
    "method": "propensity_score_matching",
    "estimator": "logistic_regression",
    "matching": {
        "method": "nearest_neighbor",
        "caliper": 0.1,
        "replacement": False,
        "ratio": 1
    },
    "balance_check": True,
    "covariates": ["age", "income", "prior_purchases", "engagement_score"]
}
```

### Difference-in-Differences

```python
# DiD configuration
did_config = {
    "method": "difference_in_differences",
    "treatment_group": "stores_with_intervention",
    "control_group": "stores_without_intervention",
    "pre_period": ["2023-01", "2023-06"],
    "post_period": ["2023-07", "2023-12"],
    "parallel_trends_test": True,
    "fixed_effects": ["store_id", "month"]
}
```

### Causal Forest (Heterogeneous Effects)

```python
# Causal forest for CATE
causal_forest_config = {
    "method": "causal_forest",
    "n_trees": 1000,
    "honest": True,
    "effect_modifiers": ["customer_segment", "tenure", "region"],
    "output": {
        "individual_effects": True,
        "confidence_intervals": True,
        "variable_importance": True
    }
}
```

## Method Selection Guide

| Method | When to Use | Assumptions |
|--------|-------------|-------------|
| Propensity Score | Selection on observables | No unmeasured confounding |
| Difference-in-Differences | Pre/post with control group | Parallel trends |
| Regression Discontinuity | Threshold-based treatment | Continuity at threshold |
| Instrumental Variables | Unmeasured confounding exists | Valid instrument |
| Synthetic Control | Aggregate-level intervention | Pre-treatment fit |
| Causal Forest | Heterogeneous effects | Unconfoundedness |

## Input Schema

```json
{
  "causal_problem": {
    "treatment": "string",
    "outcome": "string",
    "confounders": ["string"],
    "effect_type": "ATE|ATT|CATE"
  },
  "data": "dataframe or path",
  "method_config": {
    "method": "string",
    "parameters": "object"
  },
  "validation": {
    "refutation_tests": ["placebo", "subset", "random_common_cause"],
    "sensitivity_analysis": "boolean"
  }
}
```

## Output Schema

```json
{
  "effect_estimate": {
    "point_estimate": "number",
    "confidence_interval": ["number", "number"],
    "p_value": "number",
    "standard_error": "number"
  },
  "heterogeneous_effects": {
    "subgroup": {
      "effect": "number",
      "ci": ["number", "number"]
    }
  },
  "diagnostics": {
    "balance_statistics": "object",
    "parallel_trends_test": "object",
    "first_stage_f_stat": "number (IV)"
  },
  "refutation_results": {
    "test_name": {
      "original_effect": "number",
      "refuted_effect": "number",
      "passed": "boolean"
    }
  },
  "sensitivity": {
    "robustness_value": "number",
    "interpretation": "string"
  }
}
```

## Best Practices

1. Clearly articulate the causal question before analysis
2. Draw a causal diagram (DAG) to identify confounders
3. Check covariate balance after matching/weighting
4. Perform sensitivity analysis to unmeasured confounding
5. Use multiple refutation tests to validate results
6. Report effect sizes with confidence intervals
7. Be transparent about assumptions and limitations

## Refutation Tests

| Test | What It Checks |
|------|----------------|
| Placebo Treatment | Effect should be zero with random treatment |
| Placebo Outcome | Effect should be zero with unrelated outcome |
| Subset Validation | Effect should hold in subsamples |
| Random Common Cause | Adding random confounder shouldn't change effect |

## Integration Points

- Feeds into Hypothesis Tracker for test results
- Connects with Experimentation Manager agent
- Supports Predictive Analyst for causal features
- Integrates with Bayesian Network Analyzer for causal graphs
