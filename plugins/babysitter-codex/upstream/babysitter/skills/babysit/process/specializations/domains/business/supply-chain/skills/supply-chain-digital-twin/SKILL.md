---
name: supply-chain-digital-twin
description: Digital twin representation of supply chain for real-time monitoring and simulation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: cross-functional
  priority: future
---

# Supply Chain Digital Twin

## Overview

The Supply Chain Digital Twin creates a virtual representation of the physical supply chain for real-time monitoring, predictive analytics, and simulation. It enables continuous optimization through what-if analysis and performance prediction.

## Capabilities

- **Real-Time Supply Chain State Representation**: Live digital model
- **Predictive Analytics Integration**: Forward-looking performance prediction
- **Scenario Simulation**: What-if analysis on digital model
- **Anomaly Detection**: Deviation identification from expected patterns
- **Optimization Recommendation**: AI-driven improvement suggestions
- **What-If Analysis**: Impact assessment of proposed changes
- **Performance Prediction**: Future state forecasting
- **Continuous Learning Integration**: Model improvement from actuals

## Input Schema

```yaml
digital_twin_request:
  twin_scope:
    network_elements: array
    processes: array
    time_horizon: string
  real_time_feeds:
    erp_integration: object
    iot_sensors: array
    tracking_feeds: array
  model_configuration:
    physics_models: object
    ml_models: array
    business_rules: array
  simulation_scenarios: array
  prediction_horizon: string
  anomaly_detection_config:
    sensitivity: float
    alert_rules: array
```

## Output Schema

```yaml
digital_twin_output:
  current_state:
    network_status: object
    inventory_positions: object
    in_transit: array
    production_status: object
    kpis: object
  predictions:
    demand_forecast: object
    supply_forecast: object
    risk_predictions: array
    kpi_projections: object
  anomalies:
    detected_anomalies: array
      - anomaly_id: string
        type: string
        severity: string
        location: string
        description: string
        recommended_action: string
  scenario_results:
    scenarios: array
      - scenario_name: string
        predicted_outcomes: object
        risks: array
        recommendations: array
  optimization_recommendations:
    immediate: array
    short_term: array
    strategic: array
  model_health:
    accuracy_metrics: object
    data_quality: object
    model_drift: object
  visualizations:
    network_view: object
    flow_animation: object
    prediction_charts: array
```

## Usage

### Real-Time Network Monitoring

```
Input: Live data feeds, network model
Process: Update digital twin state continuously
Output: Real-time visibility dashboard
```

### Predictive Performance Analysis

```
Input: Current state, ML models, forecast horizon
Process: Predict future network performance
Output: Performance predictions with confidence
```

### What-If Scenario Analysis

```
Input: Proposed change, current twin state
Process: Simulate impact on digital twin
Output: Scenario outcome prediction
```

## Integration Points

- **IoT Platforms**: Sensor and device data
- **Real-Time Data Streams**: Event streaming platforms
- **ML Platforms**: Predictive model deployment
- **Visualization Platforms**: 3D and interactive visualization
- **Tools/Libraries**: Digital twin platforms, IoT integration, ML models

## Process Dependencies

- Supply Chain Network Design
- Supply Chain Disruption Response
- Supply Chain KPI Dashboard Development

## Best Practices

1. Start with high-value use cases
2. Ensure real-time data quality
3. Validate twin accuracy regularly
4. Balance model complexity with maintainability
5. Integrate with decision-making processes
6. Plan for continuous model improvement
