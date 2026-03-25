---
name: demand-forecaster
description: Demand forecasting skill with statistical and machine learning methods.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: supply-chain
  backlog-id: SK-IE-024
---

# demand-forecaster

You are **demand-forecaster** - a specialized skill for forecasting product demand using statistical and machine learning methods.

## Overview

This skill enables AI-powered demand forecasting including:
- Time series decomposition (trend, seasonality, residual)
- Moving average and exponential smoothing
- ARIMA/SARIMA modeling
- Prophet forecasting for business time series
- Machine learning regression models
- Forecast accuracy metrics (MAPE, MAE, RMSE, bias)
- Demand sensing and adjustment
- New product forecasting with analogies

## Capabilities

### 1. Time Series Decomposition

```python
import numpy as np
import pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose

def decompose_demand(data: pd.Series, period: int = 12, model: str = 'additive'):
    """
    Decompose time series into trend, seasonal, and residual components

    model: 'additive' or 'multiplicative'
    """
    decomposition = seasonal_decompose(data, model=model, period=period)

    return {
        "trend": decomposition.trend,
        "seasonal": decomposition.seasonal,
        "residual": decomposition.resid,
        "model": model,
        "period": period,
        "summary": {
            "trend_range": (decomposition.trend.min(), decomposition.trend.max()),
            "seasonal_amplitude": decomposition.seasonal.max() - decomposition.seasonal.min(),
            "residual_std": decomposition.resid.std()
        }
    }
```

### 2. Exponential Smoothing Methods

```python
from statsmodels.tsa.holtwinters import ExponentialSmoothing, SimpleExpSmoothing

def simple_exponential_smoothing(data: pd.Series, alpha: float = None):
    """
    Simple Exponential Smoothing (SES) for level-only data
    """
    model = SimpleExpSmoothing(data)
    if alpha:
        fit = model.fit(smoothing_level=alpha, optimized=False)
    else:
        fit = model.fit(optimized=True)

    return {
        "model": "SES",
        "alpha": fit.params['smoothing_level'],
        "fitted_values": fit.fittedvalues,
        "forecast_method": fit
    }

def holt_winters(data: pd.Series, seasonal_periods: int = 12,
                 trend: str = 'add', seasonal: str = 'add'):
    """
    Holt-Winters Exponential Smoothing with trend and seasonality
    """
    model = ExponentialSmoothing(
        data,
        trend=trend,
        seasonal=seasonal,
        seasonal_periods=seasonal_periods
    )
    fit = model.fit(optimized=True)

    return {
        "model": "Holt-Winters",
        "parameters": {
            "alpha": fit.params.get('smoothing_level'),
            "beta": fit.params.get('smoothing_trend'),
            "gamma": fit.params.get('smoothing_seasonal')
        },
        "fitted_values": fit.fittedvalues,
        "forecast_method": fit
    }

def forecast_exponential_smoothing(fit, periods: int):
    """Generate forecast from fitted model"""
    forecast = fit.forecast(periods)
    return {
        "forecast": forecast,
        "periods": periods
    }
```

### 3. ARIMA/SARIMA Modeling

```python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import pmdarima as pm

def auto_arima(data: pd.Series, seasonal: bool = True, m: int = 12):
    """
    Automatic ARIMA model selection
    """
    model = pm.auto_arima(
        data,
        seasonal=seasonal,
        m=m,
        stepwise=True,
        suppress_warnings=True,
        error_action='ignore',
        trace=False
    )

    return {
        "order": model.order,
        "seasonal_order": model.seasonal_order if seasonal else None,
        "aic": model.aic(),
        "bic": model.bic(),
        "model": model
    }

def fit_sarima(data: pd.Series, order: tuple, seasonal_order: tuple):
    """
    Fit SARIMA model with specified orders
    order: (p, d, q)
    seasonal_order: (P, D, Q, s)
    """
    model = SARIMAX(data, order=order, seasonal_order=seasonal_order)
    fit = model.fit(disp=False)

    return {
        "model": "SARIMA",
        "order": order,
        "seasonal_order": seasonal_order,
        "aic": fit.aic,
        "bic": fit.bic,
        "fitted_values": fit.fittedvalues,
        "residuals": fit.resid,
        "forecast_method": fit
    }

def forecast_arima(fit, periods: int, conf_level: float = 0.95):
    """Generate ARIMA forecast with confidence intervals"""
    forecast = fit.get_forecast(periods)
    ci = forecast.conf_int(alpha=1-conf_level)

    return {
        "forecast": forecast.predicted_mean,
        "lower_ci": ci.iloc[:, 0],
        "upper_ci": ci.iloc[:, 1],
        "confidence_level": conf_level
    }
```

### 4. Prophet Forecasting

```python
from prophet import Prophet

def prophet_forecast(data: pd.DataFrame, periods: int,
                    yearly_seasonality: bool = True,
                    weekly_seasonality: bool = False,
                    holidays: pd.DataFrame = None):
    """
    Facebook Prophet forecasting

    data: DataFrame with columns 'ds' (date) and 'y' (value)
    """
    model = Prophet(
        yearly_seasonality=yearly_seasonality,
        weekly_seasonality=weekly_seasonality,
        daily_seasonality=False
    )

    if holidays is not None:
        model.add_country_holidays(country_name='US')

    model.fit(data)

    future = model.make_future_dataframe(periods=periods, freq='M')
    forecast = model.predict(future)

    return {
        "model": "Prophet",
        "forecast": forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']],
        "components": {
            "trend": forecast['trend'],
            "yearly": forecast.get('yearly', None),
            "weekly": forecast.get('weekly', None)
        },
        "prophet_model": model
    }
```

### 5. Forecast Accuracy Metrics

```python
def calculate_forecast_accuracy(actual: np.array, forecast: np.array):
    """
    Calculate comprehensive forecast accuracy metrics
    """
    actual = np.array(actual)
    forecast = np.array(forecast)
    errors = actual - forecast

    n = len(actual)

    # Mean Absolute Error
    mae = np.mean(np.abs(errors))

    # Root Mean Square Error
    rmse = np.sqrt(np.mean(errors**2))

    # Mean Absolute Percentage Error (handle zeros)
    with np.errstate(divide='ignore', invalid='ignore'):
        ape = np.abs(errors / actual) * 100
        ape = np.where(np.isfinite(ape), ape, 0)
    mape = np.mean(ape)

    # Weighted MAPE (weighted by actual values)
    wmape = np.sum(np.abs(errors)) / np.sum(actual) * 100

    # Bias (Mean Error)
    bias = np.mean(errors)
    bias_percent = (bias / np.mean(actual)) * 100

    # Tracking Signal
    cumulative_error = np.sum(errors)
    mad = np.mean(np.abs(errors))
    tracking_signal = cumulative_error / mad if mad > 0 else 0

    return {
        "MAE": round(mae, 2),
        "RMSE": round(rmse, 2),
        "MAPE": round(mape, 2),
        "WMAPE": round(wmape, 2),
        "Bias": round(bias, 2),
        "Bias_Percent": round(bias_percent, 2),
        "Tracking_Signal": round(tracking_signal, 2),
        "interpretation": interpret_accuracy(mape, bias_percent, tracking_signal)
    }

def interpret_accuracy(mape, bias_pct, tracking_signal):
    interpretations = []

    if mape < 10:
        interpretations.append("Excellent accuracy (MAPE < 10%)")
    elif mape < 20:
        interpretations.append("Good accuracy (MAPE 10-20%)")
    elif mape < 30:
        interpretations.append("Fair accuracy (MAPE 20-30%)")
    else:
        interpretations.append("Poor accuracy (MAPE > 30%)")

    if abs(bias_pct) > 5:
        direction = "over" if bias_pct < 0 else "under"
        interpretations.append(f"Systematic {direction}-forecasting (Bias {bias_pct:.1f}%)")

    if abs(tracking_signal) > 4:
        interpretations.append("Tracking signal out of control - model review needed")

    return interpretations
```

### 6. New Product Forecasting

```python
def analogy_forecast(analogous_product_history: pd.Series,
                    new_product_attributes: dict,
                    analog_attributes: dict):
    """
    Forecast new product demand using analogous product history
    """
    # Calculate scaling factors based on attribute differences
    scaling_factors = {}

    # Price adjustment
    if 'price' in new_product_attributes and 'price' in analog_attributes:
        price_ratio = analog_attributes['price'] / new_product_attributes['price']
        # Price elasticity approximation
        scaling_factors['price'] = price_ratio ** 1.5  # Assuming elasticity of -1.5

    # Market size adjustment
    if 'market_size' in new_product_attributes:
        scaling_factors['market'] = (new_product_attributes['market_size'] /
                                     analog_attributes.get('market_size', 1))

    # Calculate combined scaling factor
    combined_factor = np.prod(list(scaling_factors.values())) if scaling_factors else 1.0

    # Generate forecast
    forecast = analogous_product_history * combined_factor

    return {
        "method": "Analogy",
        "analogous_product": analog_attributes.get('name', 'Unknown'),
        "scaling_factors": scaling_factors,
        "combined_factor": combined_factor,
        "forecast": forecast,
        "confidence": "Low - based on single analogy",
        "recommendation": "Collect actual data as soon as possible to refine"
    }
```

## Process Integration

This skill integrates with the following processes:
- `demand-forecasting-model-development.js`
- `inventory-optimization-analysis.js`
- `capacity-planning-analysis.js`

## Output Format

```json
{
  "forecast_model": "SARIMA(1,1,1)(1,1,1,12)",
  "forecast_periods": 12,
  "forecast": [120, 135, 142, ...],
  "confidence_intervals": {
    "lower": [110, 125, 130, ...],
    "upper": [130, 145, 154, ...]
  },
  "accuracy_metrics": {
    "MAPE": 8.5,
    "RMSE": 15.2,
    "Bias": -2.1
  },
  "interpretation": "Excellent accuracy with slight under-forecasting tendency"
}
```

## Best Practices

1. **Clean data first** - Handle outliers, missing values
2. **Test multiple models** - Compare accuracy
3. **Use holdout validation** - Don't overfit
4. **Monitor forecast error** - Track ongoing accuracy
5. **Incorporate judgment** - Combine statistical and human input
6. **Document assumptions** - Record all model decisions

## Constraints

- Historical data required for statistical methods
- Seasonality requires sufficient history
- External factors may not be captured
- Forecast accuracy degrades with horizon
