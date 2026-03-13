---
name: demand-forecaster
description: Demand forecasting skill with quantitative and qualitative methods, accuracy measurement, and bias correction
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: capacity-planning
---

# Demand Forecaster

## Overview

The Demand Forecaster skill provides comprehensive capabilities for generating and managing demand forecasts. It supports multiple forecasting methods, accuracy measurement, bias correction, and integration of statistical and judgmental inputs.

## Capabilities

- Time series forecasting (ARIMA, exponential smoothing)
- Causal modeling
- Machine learning forecasts
- Forecast accuracy metrics (MAPE, MAE, bias)
- Collaborative forecasting
- Demand sensing
- Seasonality adjustment
- New product forecasting

## Used By Processes

- CAP-004: Demand Forecasting and Analysis
- CAP-003: Sales and Operations Planning
- CAP-001: Capacity Requirements Planning

## Tools and Libraries

- Python statsmodels
- Prophet
- ML libraries (scikit-learn, TensorFlow)
- Demand planning systems

## Usage

```yaml
skill: demand-forecaster
inputs:
  historical_data:
    - period: "2025-01"
      demand: 10500
    - period: "2025-02"
      demand: 11200
    # ... additional history
  forecast_horizon: 12  # months
  method: "auto"  # auto | arima | exponential | ml | ensemble
  external_factors:
    - name: "gdp_growth"
      coefficient: 0.5
    - name: "marketing_spend"
      coefficient: 0.3
  adjustments:
    - period: "2026-06"
      type: "promotion"
      lift: 15  # percent
outputs:
  - point_forecast
  - confidence_intervals
  - accuracy_metrics
  - bias_analysis
  - seasonality_factors
  - recommendations
```

## Forecasting Methods

### Time Series Methods

| Method | Best For | Complexity |
|--------|----------|------------|
| Moving Average | Stable demand | Low |
| Exponential Smoothing | Trends and seasonality | Medium |
| ARIMA | Complex patterns | High |
| Prophet | Multiple seasonalities | Medium |

### Causal Methods

| Method | Use Case |
|--------|----------|
| Regression | Known drivers |
| Econometric | Market factors |
| Machine Learning | Complex relationships |

## Accuracy Metrics

```
MAPE = (1/n) x Sum(|Actual - Forecast| / Actual) x 100

MAE = (1/n) x Sum(|Actual - Forecast|)

Bias = (1/n) x Sum(Forecast - Actual)
```

## Accuracy Benchmarks

| MAPE | Interpretation |
|------|----------------|
| < 10% | Excellent |
| 10-20% | Good |
| 20-30% | Acceptable |
| 30-50% | Poor |
| > 50% | Very poor |

## Forecast Value Added (FVA)

Compare accuracy at each step:
1. Naive forecast (prior period)
2. Statistical forecast
3. Analyst adjustments
4. Sales/customer input
5. Final consensus

Only keep adjustments that improve accuracy.

## Integration Points

- ERP/demand planning systems
- CRM systems
- Point of sale data
- Economic data feeds
