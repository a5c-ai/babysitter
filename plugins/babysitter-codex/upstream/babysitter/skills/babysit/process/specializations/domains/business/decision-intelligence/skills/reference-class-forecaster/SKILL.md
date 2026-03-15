---
name: reference-class-forecaster
description: Reference class forecasting skill to counter optimism bias using historical analogies
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
  tools-libraries:
    - scipy.stats
    - pandas
    - custom algorithms
---

# Reference Class Forecaster

## Overview

The Reference Class Forecaster skill implements reference class forecasting methodology to counter optimism bias and the planning fallacy. It uses historical data from comparable projects or decisions to generate empirically-grounded forecasts, providing an "outside view" to complement internal estimates.

## Capabilities

- Reference class selection and validation
- Distribution fitting from historical data
- Adjustment factor calculation
- Uncertainty quantification
- Bias correction for planning fallacy
- Documentation of reference class rationale
- Comparison with inside view estimates
- Reconciliation guidance

## Used By Processes

- Cognitive Bias Debiasing Process
- Decision Quality Assessment
- Strategic Scenario Development

## Usage

### Reference Class Definition

```python
# Define reference class
reference_class = {
    "name": "Enterprise Software Implementations",
    "description": "Large-scale ERP implementations in manufacturing companies",
    "criteria": {
        "project_type": "ERP implementation",
        "industry": "manufacturing",
        "company_size": {"min": 1000, "max": 10000, "metric": "employees"},
        "project_budget": {"min": 5000000, "max": 20000000},
        "time_period": {"start": "2015", "end": "2023"}
    },
    "sample_size": 47,
    "data_source": "industry_benchmark_database"
}
```

### Historical Data

```python
# Reference class outcomes
historical_outcomes = {
    "cost_overrun": {
        "data": [1.15, 1.32, 1.08, 1.45, 1.22, ...],  # ratio to budget
        "unit": "ratio_to_budget"
    },
    "schedule_overrun": {
        "data": [1.20, 1.50, 1.10, 1.65, 1.35, ...],  # ratio to plan
        "unit": "ratio_to_planned_duration"
    },
    "benefit_realization": {
        "data": [0.75, 0.60, 0.85, 0.45, 0.70, ...],  # ratio to expected
        "unit": "ratio_to_expected_benefits"
    }
}
```

### Inside View Estimate

```python
# Current project estimate (inside view)
inside_view = {
    "project_name": "SAP S/4HANA Implementation",
    "estimated_cost": 12000000,
    "estimated_duration_months": 18,
    "expected_annual_benefits": 4000000,
    "confidence_level": 0.80,  # team's stated confidence
    "key_assumptions": [
        "Experienced implementation partner",
        "Strong executive sponsorship",
        "Proven methodology"
    ]
}
```

### Adjustment Configuration

```python
# Adjustment settings
adjustment_config = {
    "similarity_factors": {
        "project_complexity": {"current": "high", "weight": 0.3},
        "organizational_readiness": {"current": "medium", "weight": 0.25},
        "vendor_experience": {"current": "high", "weight": 0.2},
        "scope_definition": {"current": "medium", "weight": 0.25}
    },
    "adjustment_method": "regression_to_mean",
    "output_percentiles": [10, 25, 50, 75, 90]
}
```

## Reference Class Selection Criteria

| Criterion | Good Practice | Poor Practice |
|-----------|---------------|---------------|
| Similarity | Same project type, context | Loosely related |
| Sample Size | n >= 20 | n < 10 |
| Data Quality | Verified outcomes | Self-reported |
| Recency | Last 5-10 years | > 15 years old |
| Completeness | Full project lifecycle | Partial data |

## Input Schema

```json
{
  "reference_class": {
    "name": "string",
    "criteria": "object",
    "sample_size": "number"
  },
  "historical_outcomes": {
    "metric_name": {
      "data": ["number"],
      "unit": "string"
    }
  },
  "inside_view": {
    "estimates": "object",
    "confidence_level": "number",
    "assumptions": ["string"]
  },
  "adjustment_config": {
    "similarity_factors": "object",
    "output_percentiles": ["number"]
  }
}
```

## Output Schema

```json
{
  "reference_class_statistics": {
    "metric_name": {
      "mean": "number",
      "median": "number",
      "std": "number",
      "percentiles": "object",
      "best_fit_distribution": "string"
    }
  },
  "adjusted_forecasts": {
    "metric_name": {
      "P10": "number",
      "P50": "number",
      "P90": "number",
      "expected_value": "number"
    }
  },
  "comparison": {
    "inside_view": "number",
    "outside_view_median": "number",
    "bias_factor": "number",
    "confidence_calibration": "string"
  },
  "reconciliation": {
    "recommended_estimate": "number",
    "rationale": "string",
    "residual_uncertainty": "object"
  }
}
```

## Best Practices

1. Select reference class before seeing inside view estimate
2. Use objective criteria for class membership
3. Seek disconfirming evidence on project uniqueness
4. Document why reference class is appropriate
5. Present both views to decision-makers
6. Weight outside view more heavily initially
7. Update as project-specific information emerges

## Bias Correction

Common biases addressed:
- **Planning fallacy**: Systematic underestimation of time/cost
- **Optimism bias**: Overestimation of benefits
- **Uniqueness bias**: "Our project is different"
- **Anchoring**: Insufficient adjustment from initial estimate

## Integration Points

- Feeds into Decision Quality Assessment
- Connects with Calibration Trainer for accuracy improvement
- Supports Debiasing Coach agent
- Integrates with Pre-mortem Facilitator for risk identification
