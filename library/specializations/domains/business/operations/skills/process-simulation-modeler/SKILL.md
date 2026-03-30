---
name: process-simulation-modeler
description: Discrete event simulation skill for process modeling, scenario testing, and optimization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: operational-analytics
---

# Process Simulation Modeler

## Overview

The Process Simulation Modeler skill provides comprehensive capabilities for discrete event simulation. It supports process flow modeling, resource allocation analysis, scenario comparison, and capacity optimization.

## Capabilities

- Process flow modeling
- Resource allocation simulation
- Queue behavior analysis
- Scenario comparison
- What-if analysis
- Capacity optimization
- Layout simulation
- Monte Carlo simulation

## Used By Processes

- LEAN-004: Kanban System Design
- CAP-001: Capacity Requirements Planning
- TOC-002: Drum-Buffer-Rope Scheduling

## Tools and Libraries

- AnyLogic
- FlexSim
- Simio
- SimPy

## Usage

```yaml
skill: process-simulation-modeler
inputs:
  model_type: "discrete_event"  # discrete_event | continuous | agent_based
  process_flow:
    - step: "Arrival"
      distribution: "exponential"
      rate: 10  # per hour
    - step: "Processing"
      distribution: "normal"
      mean: 5
      std_dev: 1
    - step: "Inspection"
      distribution: "uniform"
      min: 2
      max: 4
  resources:
    - name: "Operator"
      quantity: 2
    - name: "Inspector"
      quantity: 1
  simulation_parameters:
    run_length: 480  # minutes
    replications: 30
    warm_up: 60  # minutes
outputs:
  - simulation_model
  - performance_metrics
  - utilization_statistics
  - queue_analysis
  - scenario_comparison
  - recommendations
```

## Simulation Components

### Entities
- Items flowing through the system
- Examples: products, customers, orders

### Resources
- Required for processing
- Examples: machines, operators, tools

### Queues
- Waiting areas
- FIFO, priority, or custom rules

### Processes
- Work performed on entities
- Service time distributions

## Statistical Distributions

| Distribution | Use Case | Parameters |
|--------------|----------|------------|
| Exponential | Arrival times | Mean |
| Normal | Processing times | Mean, Std Dev |
| Triangular | Limited data | Min, Mode, Max |
| Uniform | Equal probability | Min, Max |
| Lognormal | Repair times | Mean, Std Dev |
| Weibull | Equipment life | Shape, Scale |

## Performance Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Throughput | Units per time period | Maximize |
| Cycle Time | Time through system | Minimize |
| WIP | Work in process | Minimize |
| Utilization | Resource busy % | 70-85% |
| Queue Length | Entities waiting | Minimize |
| Wait Time | Time in queue | Minimize |

## Scenario Analysis Process

1. Build baseline model
2. Validate against actual data
3. Define scenarios to test
4. Run simulations
5. Analyze results
6. Make recommendations

## Monte Carlo Simulation

For uncertainty analysis:
```
1. Define input distributions
2. Run many iterations
3. Collect output distributions
4. Calculate confidence intervals
5. Identify risk factors
```

## Model Validation

- Compare to historical data
- Face validity with experts
- Sensitivity analysis
- Stress testing

## Integration Points

- CAD/layout systems
- ERP data sources
- Real-time data feeds
- Optimization solvers
