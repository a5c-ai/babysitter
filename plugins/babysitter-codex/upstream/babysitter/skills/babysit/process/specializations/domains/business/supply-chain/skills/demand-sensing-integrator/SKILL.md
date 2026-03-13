---
name: demand-sensing-integrator
description: Real-time demand signal integration from POS, channel data, and external signals for short-term forecast enhancement
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

# Demand Sensing Integrator

## Overview

The Demand Sensing Integrator captures and processes real-time demand signals from multiple sources including point-of-sale data, channel inventory, weather patterns, social media sentiment, and economic indicators. It enables short-term forecast enhancement by detecting demand pattern changes faster than traditional forecasting methods.

## Capabilities

- **POS Data Ingestion**: Real-time point-of-sale data collection and cleansing
- **Channel Inventory Visibility**: Multi-channel inventory position integration
- **Weather Impact Correlation**: Weather-driven demand adjustments
- **Social Media Sentiment Analysis**: Consumer sentiment signal extraction
- **Economic Indicator Integration**: Macro-economic factor incorporation
- **Market Intelligence Feeds**: Competitor and market signal processing
- **Near-Term Demand Adjustment**: Short-horizon forecast corrections
- **Signal-to-Noise Filtering**: Distinguish meaningful signals from noise

## Input Schema

```yaml
sensing_request:
  signal_sources:
    pos_data: object              # Point-of-sale feeds
    channel_inventory: object     # Inventory by channel
    weather_data: object          # Weather forecasts/actuals
    social_signals: object        # Social media data
    economic_indicators: object   # Economic data feeds
  baseline_forecast: object       # Current forecast to adjust
  sensing_horizon: integer        # Days/weeks to sense
  sensitivity_thresholds: object  # Signal detection thresholds
```

## Output Schema

```yaml
sensing_output:
  adjusted_forecast: object
    - period: string
      baseline: float
      sensed_adjustment: float
      final_forecast: float
      signal_contributions: object
  detected_signals: array
    - signal_type: string
      magnitude: float
      confidence: float
      source: string
  recommendations: array
```

## Usage

### Real-Time POS Integration

```
Input: Daily POS data from retail channels
Process: Compare actual sales velocity to forecast, detect deviations
Output: Adjusted near-term forecast with POS-based corrections
```

### Weather-Driven Adjustment

```
Input: 10-day weather forecast + historical weather-demand correlation
Process: Calculate weather impact on category demand
Output: Weather-adjusted demand forecast by location
```

### Sentiment-Based Demand Signal

```
Input: Social media mentions, review sentiment trends
Process: Correlate sentiment changes with demand patterns
Output: Sentiment-influenced demand adjustments
```

## Integration Points

- **Data Pipelines**: Apache Kafka, real-time streaming platforms
- **External APIs**: Weather services, social media APIs, economic data providers
- **Planning Systems**: Integration with demand planning platforms
- **Tools/Libraries**: Stream processing frameworks, NLP libraries

## Process Dependencies

- Demand Forecasting and Planning
- Sales and Operations Planning (S&OP)
- Supply Chain Disruption Response

## Best Practices

1. Establish clear signal latency requirements
2. Implement robust data quality checks on incoming signals
3. Calibrate signal weights based on historical accuracy
4. Monitor signal source reliability continuously
5. Balance responsiveness with forecast stability
6. Document signal sources and transformation logic
