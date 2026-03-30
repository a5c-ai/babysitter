---
name: forecast-accuracy-analyzer
description: Forecast accuracy measurement and improvement skill with error decomposition
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: analytics
  priority: standard
---

# Forecast Accuracy Analyzer

## Overview

The Forecast Accuracy Analyzer provides comprehensive forecast accuracy measurement, error decomposition, and improvement recommendation capabilities. It supports continuous forecast quality improvement through root cause analysis and model performance comparison.

## Capabilities

- **MAPE, WMAPE, Bias Calculation**: Standard accuracy metrics
- **Forecast Error Decomposition**: Breakdown by error source
- **SKU-Level Accuracy Tracking**: Granular accuracy monitoring
- **Forecast Value-Add (FVA) Analysis**: Contribution of forecast steps
- **Root Cause Categorization**: Error driver classification
- **Model Performance Comparison**: Multi-model accuracy benchmarking
- **Improvement Recommendation Generation**: Data-driven suggestions
- **Accuracy Trend Monitoring**: Historical accuracy tracking

## Input Schema

```yaml
forecast_accuracy_request:
  forecast_data:
    forecasts: array
      - sku_id: string
        period: string
        forecast_value: float
        forecast_source: string
    period_range:
      start: date
      end: date
  actual_data:
    actuals: array
      - sku_id: string
        period: string
        actual_value: float
  analysis_parameters:
    metrics: array                # MAPE, WMAPE, Bias, etc.
    aggregation_levels: array     # SKU, category, total
    fva_steps: array              # Statistical, sales input, etc.
  segmentation:
    by_category: boolean
    by_volume: boolean
    by_variability: boolean
```

## Output Schema

```yaml
forecast_accuracy_output:
  accuracy_metrics:
    overall:
      mape: float
      wmape: float
      bias: float
      mpe: float
    by_segment: array
    by_sku: array
  error_decomposition:
    systematic_error: float
    random_error: float
    outlier_impact: float
    by_source: object
  fva_analysis:
    steps: array
      - step_name: string
        value_add: float
        before_accuracy: float
        after_accuracy: float
    recommendations: array
  root_cause_analysis:
    error_categories: array
      - category: string
        frequency: integer
        impact: float
    top_drivers: array
  model_comparison:
    models: array
      - model_name: string
        accuracy: float
        best_for: array
  improvement_recommendations: array
    - recommendation: string
      expected_improvement: float
      implementation_effort: string
  trends:
    accuracy_over_time: object
    bias_trend: object
```

## Usage

### Monthly Accuracy Review

```
Input: Previous month's forecasts and actuals
Process: Calculate accuracy metrics by segment
Output: Accuracy report with performance analysis
```

### Forecast Value-Add Analysis

```
Input: Forecast at each process step (statistical, sales, consensus)
Process: Measure value added at each step
Output: FVA report identifying low-value steps
```

### Root Cause Investigation

```
Input: High-error SKUs, demand patterns
Process: Categorize and analyze error drivers
Output: Root cause report with recommendations
```

## Integration Points

- **Planning Systems**: Forecast and actual data
- **BI Platforms**: Accuracy dashboards
- **Statistical Tools**: Advanced analysis
- **Tools/Libraries**: Statistical analysis, visualization

## Process Dependencies

- Forecast Accuracy Analysis and Improvement
- Demand Forecasting and Planning
- Sales and Operations Planning (S&OP)

## Best Practices

1. Measure accuracy at multiple aggregation levels
2. Use weighted metrics for volume importance
3. Investigate outliers before concluding
4. Compare models on like-for-like basis
5. Set realistic improvement targets
6. Share accuracy results with stakeholders
