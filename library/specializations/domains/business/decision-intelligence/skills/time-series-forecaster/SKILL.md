---
name: time-series-forecaster
description: Time series forecasting skill for business metric prediction and demand planning
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
    - prophet
    - statsforecast
    - darts
    - sktime
    - nixtla
---

# Time Series Forecaster

## Overview

The Time Series Forecaster skill provides comprehensive capabilities for predicting business metrics over time using classical statistical methods, machine learning, and deep learning approaches. It supports automated model selection, ensemble forecasting, and uncertainty quantification for robust business planning.

## Capabilities

- Classical methods (ARIMA, ETS, Theta)
- Machine learning methods (XGBoost, LightGBM for time series)
- Deep learning methods (Prophet, N-BEATS, Temporal Fusion Transformer)
- Ensemble forecasting
- Prediction interval generation
- Forecast accuracy metrics (MAPE, RMSE, MASE)
- Anomaly detection
- Seasonality decomposition

## Used By Processes

- Predictive Analytics Implementation
- KPI Framework Development
- Market Sizing and Opportunity Assessment

## Usage

### Data Input

```python
# Time series data configuration
time_series_data = {
    "target": "monthly_revenue",
    "datetime_column": "date",
    "frequency": "M",  # Monthly
    "data": [
        {"date": "2023-01-01", "value": 1000000, "marketing_spend": 50000},
        {"date": "2023-02-01", "value": 1050000, "marketing_spend": 55000},
        # ... more data
    ],
    "exogenous_variables": ["marketing_spend", "economic_index"],
    "special_events": [
        {"date": "2023-11-24", "event": "black_friday", "impact": "positive"},
        {"date": "2023-12-25", "event": "christmas", "impact": "mixed"}
    ]
}
```

### Model Configuration

```python
# Forecasting configuration
forecast_config = {
    "horizon": 12,  # 12 months ahead
    "models": {
        "auto_select": True,
        "candidates": ["arima", "ets", "prophet", "lightgbm"],
        "ensemble": {
            "method": "weighted_average",
            "weights": "based_on_cv_performance"
        }
    },
    "validation": {
        "method": "time_series_cv",
        "n_splits": 5,
        "test_size": 3
    },
    "prediction_intervals": [0.50, 0.80, 0.95]
}
```

### Seasonality Analysis

```python
# Seasonality decomposition
seasonality_config = {
    "method": "stl",  # or "classical", "x13"
    "seasonal_periods": [12],  # yearly for monthly data
    "robust": True,
    "output_components": ["trend", "seasonal", "residual"]
}
```

## Model Selection Guide

| Model | Best For | Handles |
|-------|----------|---------|
| ARIMA | Stationary data with autocorrelation | Trend, AR/MA patterns |
| ETS | Exponential patterns | Trend, Seasonality, Error |
| Prophet | Business time series | Trend, Multiple seasonality, Holidays |
| Theta | Simple forecasting | Trend extrapolation |
| N-BEATS | Complex patterns | Non-linear trends, Interpretable |
| TFT | Multi-horizon, multivariate | Exogenous vars, Attention |
| XGBoost | Feature-rich forecasting | Exogenous variables |

## Accuracy Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| MAPE | Mean Absolute Percentage Error | Scale-independent comparison |
| RMSE | Root Mean Square Error | Penalizes large errors |
| MASE | Mean Absolute Scaled Error | Compares to naive forecast |
| SMAPE | Symmetric MAPE | Handles near-zero values |
| Coverage | % in prediction interval | Calibration check |

## Input Schema

```json
{
  "time_series": {
    "target": "string",
    "datetime_column": "string",
    "frequency": "string",
    "data": ["object"],
    "exogenous_variables": ["string"]
  },
  "forecast_config": {
    "horizon": "number",
    "models": "object",
    "validation": "object",
    "prediction_intervals": ["number"]
  },
  "analysis_options": {
    "decomposition": "boolean",
    "anomaly_detection": "boolean",
    "feature_importance": "boolean"
  }
}
```

## Output Schema

```json
{
  "forecasts": {
    "point_forecast": ["number"],
    "prediction_intervals": {
      "lower_80": ["number"],
      "upper_80": ["number"],
      "lower_95": ["number"],
      "upper_95": ["number"]
    },
    "dates": ["string"]
  },
  "model_performance": {
    "selected_model": "string",
    "cv_metrics": {
      "MAPE": "number",
      "RMSE": "number",
      "MASE": "number"
    },
    "all_models": "object"
  },
  "decomposition": {
    "trend": ["number"],
    "seasonal": ["number"],
    "residual": ["number"]
  },
  "anomalies": [
    {
      "date": "string",
      "value": "number",
      "expected": "number",
      "severity": "string"
    }
  ],
  "feature_importance": "object (if applicable)"
}
```

## Best Practices

1. Use at least 2-3 full seasonal cycles of historical data
2. Check for and handle missing values appropriately
3. Consider external factors (holidays, promotions, economic indicators)
4. Validate with time series cross-validation (not random split)
5. Report prediction intervals, not just point forecasts
6. Monitor forecast accuracy over time and retrain as needed
7. Be cautious with long-horizon forecasts (uncertainty compounds)

## Integration Points

- Feeds into KPI Tracker for forward-looking metrics
- Connects with Monte Carlo Engine for scenario analysis
- Supports Predictive Analyst agent
- Integrates with Decision Visualization for forecast charts
