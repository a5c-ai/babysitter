---
name: demand-forecasting-engine
description: Statistical demand forecasting skill using multiple algorithms with automatic model selection and accuracy tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: demand-forecasting
  priority: high
---

# Demand Forecasting Engine

## Overview

The Demand Forecasting Engine provides comprehensive statistical and machine learning-based demand forecasting capabilities. It supports multiple forecasting algorithms with automatic model selection, ensemble averaging, and continuous accuracy tracking to generate reliable demand predictions for supply chain planning.

## Capabilities

- **Time Series Forecasting**: ARIMA, exponential smoothing, Holt-Winters methods
- **Machine Learning Models**: XGBoost, LSTM neural networks for complex demand patterns
- **Causal Factor Integration**: Incorporate promotions, seasonality, trends, and external drivers
- **Demand Sensing**: Short-term signal incorporation for near-term forecast adjustment
- **Accuracy Metrics**: MAPE, WMAPE, bias calculation and tracking
- **Automatic Model Selection**: Best-fit algorithm selection based on data characteristics
- **Ensemble Averaging**: Combine multiple model outputs for improved accuracy
- **Confidence Intervals**: Generate prediction intervals for uncertainty quantification
- **Forecast Value-Add (FVA) Analysis**: Measure contribution of each forecasting step

## Input Schema

```yaml
forecast_request:
  sku_ids: array[string]           # SKUs to forecast
  historical_data: object          # Historical demand data
  forecast_horizon: integer        # Periods to forecast
  granularity: string              # daily, weekly, monthly
  causal_factors:                  # Optional external factors
    promotions: array
    seasonality: object
    trends: object
  models_to_evaluate: array        # Optional specific models
  confidence_level: float          # e.g., 0.95 for 95% CI
```

## Output Schema

```yaml
forecast_output:
  forecasts: array
    - sku_id: string
      predictions: array[object]
      confidence_intervals: object
      selected_model: string
      accuracy_metrics: object
  model_comparison: object
  recommendations: array
```

## Usage

### Generate SKU-Level Forecast

```
Input: Historical sales data for SKU-12345, 12-month forecast horizon
Process: Evaluate ARIMA, Holt-Winters, XGBoost models
Output: Monthly forecasts with confidence intervals and best model selection
```

### Promotional Demand Planning

```
Input: Base demand + planned promotions calendar
Process: Adjust baseline with promotional lift factors
Output: Promotion-adjusted forecast with uplift quantification
```

### Multi-Model Ensemble

```
Input: Complex demand pattern with multiple seasonalities
Process: Run multiple models and create weighted ensemble
Output: Ensemble forecast with individual model contributions
```

## Integration Points

- **ERP Systems**: SAP, Oracle for historical demand data
- **Planning Platforms**: o9 Solutions, Kinaxis, Blue Yonder
- **Data Sources**: POS systems, channel inventory data
- **Tools/Libraries**: Prophet, statsmodels, scikit-learn, TensorFlow/PyTorch, pandas

## Process Dependencies

- Demand Forecasting and Planning
- Sales and Operations Planning (S&OP)
- Forecast Accuracy Analysis and Improvement

## Best Practices

1. Ensure sufficient historical data (minimum 2 years for seasonal patterns)
2. Cleanse outliers before model training
3. Validate forecasts against holdout periods
4. Document model selection rationale
5. Track forecast accuracy over time for continuous improvement
6. Consider demand segmentation for heterogeneous portfolios
