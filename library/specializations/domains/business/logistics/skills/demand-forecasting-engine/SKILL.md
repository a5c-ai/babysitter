---
name: demand-forecasting-engine
description: AI-powered demand prediction skill using historical data, market signals, and external factors for improved forecast accuracy
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: logistics
  domain: business
  category: inventory
  priority: high
  shared-candidate: true
---

# Demand Forecasting Engine

## Overview

The Demand Forecasting Engine is an AI-powered skill that generates accurate demand predictions using historical data, market signals, and external factors. It employs multiple forecasting methods including time series analysis and machine learning models to improve forecast accuracy and support inventory planning decisions.

## Capabilities

- **Time Series Forecasting (ARIMA, Prophet, etc.)**: Apply classical and modern time series methods for demand prediction
- **Machine Learning Demand Models**: Use ML algorithms to capture complex demand patterns and relationships
- **Promotional Lift Modeling**: Incorporate promotional calendar and estimate promotional demand lift
- **External Factor Integration (Weather, Events)**: Include weather, events, and economic indicators in forecasts
- **Forecast Accuracy Measurement**: Track and report forecast accuracy using standard metrics (MAPE, bias, etc.)
- **Demand Sensing with POS Data**: Incorporate point-of-sale data for short-term demand adjustments
- **New Product Forecasting**: Generate forecasts for new products using analogous items or market research

## Tools and Libraries

- Prophet
- statsmodels
- scikit-learn
- TensorFlow/PyTorch
- Demand Planning Platforms

## Used By Processes

- Demand Forecasting
- Reorder Point Calculation
- ABC-XYZ Analysis

## Usage

```yaml
skill: demand-forecasting-engine
inputs:
  item:
    sku: "SKU001"
    category: "Consumer Electronics"
    lifecycle_stage: "mature"
  historical_data:
    frequency: "weekly"
    periods: 104  # 2 years
    data: [...]  # Weekly demand values
  external_factors:
    include_seasonality: true
    include_promotions: true
    promotion_calendar:
      - date: "2026-02-14"
        type: "price_reduction"
        expected_lift: 1.5
    include_weather: false
  forecast_parameters:
    horizon_periods: 12
    confidence_level: 95
    methods: ["prophet", "arima", "ml_ensemble"]
outputs:
  forecasts:
    method: "ml_ensemble"  # Best performing method
    predictions:
      - period: "2026-W05"
        forecast: 1250
        lower_bound: 1125
        upper_bound: 1375
      - period: "2026-W06"
        forecast: 1180
        lower_bound: 1062
        upper_bound: 1298
  accuracy_metrics:
    historical_mape: 8.5
    historical_bias: -2.1
    tracking_signal: 0.3
  method_comparison:
    prophet: { mape: 9.2, bias: -1.5 }
    arima: { mape: 10.1, bias: 2.3 }
    ml_ensemble: { mape: 8.5, bias: -2.1 }
  recommendations:
    best_method: "ml_ensemble"
    forecast_review_flag: false
    anomalies_detected: []
```

## Integration Points

- Enterprise Resource Planning (ERP) Systems
- Demand Planning Systems
- Inventory Management Systems
- Point of Sale (POS) Systems
- External Data Providers

## Performance Metrics

- Forecast accuracy (MAPE)
- Forecast bias
- Tracking signal
- Value-added improvement
- Forecast coverage
