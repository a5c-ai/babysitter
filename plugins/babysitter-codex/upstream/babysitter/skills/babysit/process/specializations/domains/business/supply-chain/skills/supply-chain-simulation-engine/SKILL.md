---
name: supply-chain-simulation-engine
description: Supply chain discrete-event simulation for scenario testing and optimization
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

# Supply Chain Simulation Engine

## Overview

The Supply Chain Simulation Engine provides discrete-event simulation capabilities for testing supply chain scenarios, policies, and disruptions. It enables what-if analysis, Monte Carlo integration, and performance optimization through simulation-based experimentation.

## Capabilities

- **End-to-End Supply Chain Simulation**: Full network modeling
- **What-If Scenario Testing**: Policy and configuration testing
- **Disruption Impact Modeling**: Shock and recovery simulation
- **Policy Optimization Testing**: Inventory, sourcing policy experiments
- **Monte Carlo Integration**: Stochastic variability modeling
- **Sensitivity Analysis**: Parameter impact assessment
- **Animation and Visualization**: Visual simulation playback
- **Performance Metric Tracking**: KPI measurement through simulation

## Input Schema

```yaml
simulation_request:
  network_model:
    nodes: array
      - node_id: string
        type: string              # supplier, plant, DC, customer
        capacity: float
        processing_time: object
        inventory_policy: object
    arcs: array
      - from_node: string
        to_node: string
        lead_time: object
        cost: float
  demand_model:
    patterns: array
    variability: object
    events: array                 # promotions, seasonality
  supply_model:
    reliability: object
    variability: object
  simulation_parameters:
    run_length: integer
    warm_up_period: integer
    replications: integer
    random_seed: integer
  scenarios: array
    - scenario_name: string
      parameters: object
```

## Output Schema

```yaml
simulation_output:
  results_summary:
    scenarios: array
      - scenario_name: string
        kpis:
          fill_rate: object
          inventory_turns: object
          lead_time: object
          cost: object
        confidence_intervals: object
  detailed_results:
    time_series: array
    event_log: array
    bottleneck_analysis: object
  scenario_comparison:
    comparison_matrix: object
    statistical_tests: object
    best_scenario: string
  sensitivity_results:
    parameters_tested: array
    impact_analysis: object
    critical_parameters: array
  optimization_insights:
    recommendations: array
    trade_offs: object
  visualization_data:
    animation_data: object
    charts: array
```

## Usage

### Inventory Policy Simulation

```
Input: Network model, demand patterns, inventory policies
Process: Simulate multiple policy scenarios
Output: Policy comparison with fill rate and cost
```

### Disruption Impact Analysis

```
Input: Current network, disruption scenario
Process: Simulate disruption and recovery
Output: Impact quantification and recovery timeline
```

### Network Configuration Testing

```
Input: Alternative network configurations
Process: Simulate each configuration
Output: Configuration comparison and recommendation
```

## Integration Points

- **Simulation Platforms**: AnyLogic, Simul8, SimPy
- **Data Sources**: ERP, planning system data
- **Optimization Tools**: Combine with optimization
- **Visualization Tools**: Animation and dashboards
- **Tools/Libraries**: AnyLogic, Simul8, SimPy, discrete-event simulation

## Process Dependencies

- Supply Chain Network Design
- Business Continuity and Contingency Planning
- Capacity Planning and Constraint Management

## Best Practices

1. Validate model against historical data
2. Use adequate replications for statistical validity
3. Include warm-up period for steady-state analysis
4. Document model assumptions
5. Involve operations in model validation
6. Use sensitivity analysis to identify key drivers
