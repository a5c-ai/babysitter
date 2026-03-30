---
name: demand-sensing-integrator
description: Real-time demand sensing skill integrating POS data, market signals, and external factors for responsive planning
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
  category: analytics
  priority: medium
---

# Demand Sensing Integrator

## Overview

The Demand Sensing Integrator provides real-time demand sensing capabilities by integrating POS data, market signals, and external factors for responsive planning. It enables short-term forecast refinement and rapid inventory repositioning in response to changing demand patterns.

## Capabilities

- **POS Data Integration**: Integrate point-of-sale data for real-time demand visibility
- **Social Media Signal Processing**: Monitor social media for demand indicators and trend detection
- **Weather Impact Modeling**: Incorporate weather forecasts and their impact on demand
- **Event-Driven Demand Adjustment**: Adjust demand expectations based on local and global events
- **Short-Term Forecast Refinement**: Refine near-term forecasts using real-time signals
- **Inventory Repositioning Triggers**: Generate alerts for inventory repositioning based on demand shifts
- **Promotional Response Tracking**: Track actual promotional response versus planned lift

## Tools and Libraries

- POS Integration APIs
- Social Listening APIs
- Weather APIs
- ML Models (demand sensing)

## Used By Processes

- Demand Forecasting
- Reorder Point Calculation
- Multi-Channel Fulfillment

## Usage

```yaml
skill: demand-sensing-integrator
inputs:
  item:
    sku: "SKU001"
    category: "outdoor_furniture"
    locations: ["STORE001", "STORE002", "DC001"]
  real_time_data:
    pos_sales_last_7_days:
      - date: "2026-01-18"
        units: 45
      - date: "2026-01-19"
        units: 52
      - date: "2026-01-20"
        units: 48
      - date: "2026-01-21"
        units: 65
      - date: "2026-01-22"
        units: 78
      - date: "2026-01-23"
        units: 82
      - date: "2026-01-24"
        units: 95
  external_factors:
    weather_forecast:
      location: "Northeast Region"
      forecast: "unseasonably_warm"
      temperature_variance: "+15F"
      duration_days: 7
    events:
      - event: "home_improvement_show"
        location: "Boston"
        dates: ["2026-01-25", "2026-01-26", "2026-01-27"]
        expected_impact: 1.3
  baseline_forecast:
    next_7_days: [50, 50, 55, 52, 48, 45, 45]
outputs:
  demand_signals:
    trend: "accelerating"
    trend_strength: "strong"
    signals_detected:
      - signal: "weather_driven_demand"
        confidence: 92
        impact_factor: 1.45
      - signal: "event_proximity"
        confidence: 78
        impact_factor: 1.15
      - signal: "positive_sales_trend"
        confidence: 95
        impact_factor: 1.25
  adjusted_forecast:
    next_7_days: [105, 115, 125, 110, 95, 75, 65]
    adjustment_factor: 1.67
    confidence: 85
  inventory_alerts:
    - location: "STORE001"
      current_inventory: 25
      projected_demand_7_days: 85
      stockout_risk: "high"
      recommended_action: "expedite_replenishment"
      transfer_from: "DC001"
      quantity: 75
    - location: "STORE002"
      current_inventory: 40
      projected_demand_7_days: 70
      stockout_risk: "medium"
      recommended_action: "increase_replenishment"
  promotional_tracking:
    active_promotions: []
    organic_demand_increase: true
```

## Integration Points

- Point of Sale Systems
- E-commerce Platforms
- Weather Services
- Social Media APIs
- Demand Planning Systems

## Performance Metrics

- Forecast accuracy improvement
- Signal detection accuracy
- Inventory repositioning effectiveness
- Stockout prevention rate
- Response time to demand shifts
