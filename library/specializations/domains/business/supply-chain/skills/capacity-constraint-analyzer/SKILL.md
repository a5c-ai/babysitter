---
name: capacity-constraint-analyzer
description: Production capacity analysis skill using Theory of Constraints principles
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: logistics
  priority: future
---

# Capacity Constraint Analyzer

## Overview

The Capacity Constraint Analyzer provides production and supply chain capacity analysis using Theory of Constraints (TOC) principles. It identifies bottlenecks, models capacity exploitation strategies, and supports capacity investment decisions.

## Capabilities

- **Capacity Utilization Calculation**: Resource utilization analysis
- **Bottleneck Identification**: Constraint and limiting factor detection
- **Constraint Exploitation Strategies**: TOC-based improvement approaches
- **Capacity Adjustment Modeling**: Expansion and contraction scenarios
- **Lead Time Impact Analysis**: Capacity effects on delivery performance
- **Rough-Cut Capacity Planning**: Aggregate capacity assessment
- **Finite Capacity Scheduling Support**: Detailed scheduling inputs
- **Capacity Investment Analysis**: CapEx decision support

## Input Schema

```yaml
capacity_analysis_request:
  resources:
    work_centers: array
      - resource_id: string
        name: string
        available_capacity: float
        capacity_unit: string
        efficiency: float
        setup_time: float
    labor: array
    equipment: array
  demand_requirements:
    production_plan: array
    capacity_requirements: array
      - resource_id: string
        product: string
        rate: float
  constraints:
    operating_hours: object
    maintenance_windows: array
    policy_limits: object
  analysis_parameters:
    time_horizon: string
    granularity: string
    scenarios: array
```

## Output Schema

```yaml
capacity_analysis_output:
  utilization_analysis:
    by_resource: array
      - resource_id: string
        name: string
        available_capacity: float
        required_capacity: float
        utilization_percent: float
        status: string            # under, balanced, constrained, over
    summary: object
  bottleneck_identification:
    constraints: array
      - resource_id: string
        constraint_type: string
        impact: string
        root_cause: string
    constraint_ranking: array
  exploitation_strategies:
    recommendations: array
      - strategy: string
        target_resource: string
        expected_improvement: float
        implementation_effort: string
  capacity_scenarios:
    scenarios: array
      - scenario_name: string
        capacity_changes: object
        cost: float
        benefit: float
        lead_time_impact: string
  investment_analysis:
    options: array
    npv_comparison: object
    payback_analysis: object
  rough_cut_capacity_plan: object
```

## Usage

### Bottleneck Identification

```
Input: Production plan, resource capacities
Process: Calculate utilization, identify constraints
Output: Bottleneck report with ranking
```

### Capacity Scenario Analysis

```
Input: Demand growth scenarios, current capacity
Process: Model capacity options and impacts
Output: Capacity scenario comparison
```

### TOC Exploitation Strategy

```
Input: Identified constraint, current operations
Process: Apply TOC principles for exploitation
Output: Constraint exploitation recommendations
```

## Integration Points

- **ERP/MES Systems**: Capacity and production data
- **Planning Systems**: Demand and production plans
- **Scheduling Systems**: Finite capacity scheduling
- **Tools/Libraries**: Theory of Constraints frameworks, scheduling algorithms

## Process Dependencies

- Capacity Planning and Constraint Management
- Sales and Operations Planning (S&OP)
- Supply Chain Network Design

## Best Practices

1. Validate capacity data accuracy
2. Consider all constraint types (physical, policy, market)
3. Focus improvement efforts on true constraints
4. Model multiple demand scenarios
5. Include maintenance in capacity calculations
6. Review capacity plans monthly
