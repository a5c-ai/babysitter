---
name: sop-scenario-modeler
description: S&OP scenario modeling skill for demand-supply-financial plan alignment with what-if analysis
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
  priority: medium
---

# S&OP Scenario Modeler

## Overview

The S&OP Scenario Modeler enables comprehensive Sales and Operations Planning through multi-scenario modeling, demand-supply-financial plan alignment, and what-if analysis. It supports the monthly S&OP cycle by facilitating scenario comparison and consensus plan development.

## Capabilities

- **Multi-Scenario Demand Planning**: Create and compare multiple demand scenarios
- **Supply Constraint Modeling**: Model capacity, material, and resource constraints
- **Financial Impact Calculation**: Revenue, margin, and cost impact analysis
- **Capacity Utilization Optimization**: Balance capacity across scenarios
- **Inventory Investment Modeling**: Working capital implications by scenario
- **Gap Analysis and Reconciliation**: Identify and resolve demand-supply gaps
- **Executive Summary Generation**: Automated scenario comparison reports
- **Consensus Plan Tracking**: Monitor adherence to agreed plans

## Input Schema

```yaml
sop_scenario_request:
  base_scenario:
    demand_plan: object
    supply_plan: object
    financial_targets: object
  alternative_scenarios: array
    - name: string
      demand_adjustments: object
      supply_adjustments: object
  constraints:
    capacity_limits: object
    material_availability: object
    financial_bounds: object
  planning_horizon: integer
  granularity: string
```

## Output Schema

```yaml
sop_scenario_output:
  scenarios: array
    - name: string
      demand_plan: object
      supply_plan: object
      financial_projection: object
      gaps: array
      feasibility_score: float
  comparison_matrix: object
  recommendations: array
  executive_summary: string
  consensus_plan: object
```

## Usage

### Demand Scenario Comparison

```
Input: Optimistic, base, pessimistic demand scenarios
Process: Model supply response and financial impact for each
Output: Side-by-side comparison with recommendation
```

### Capacity Constraint Analysis

```
Input: Demand plan exceeding capacity in Q3
Process: Model capacity addition, demand shaping, outsourcing options
Output: Feasible scenario with cost-service tradeoffs
```

### Financial Plan Alignment

```
Input: Operations plan vs. financial budget targets
Process: Reconcile volume, price, cost assumptions
Output: Aligned operational-financial plan
```

## Integration Points

- **Planning Platforms**: o9 Solutions, Kinaxis, SAP IBP connectors
- **ERP Systems**: SAP, Oracle for master data and constraints
- **Financial Systems**: Budget and forecast integration
- **BI Tools**: Visualization and reporting

## Process Dependencies

- Sales and Operations Planning (S&OP)
- Demand Forecasting and Planning
- Capacity Planning and Constraint Management

## Best Practices

1. Define clear scenario naming conventions
2. Establish assumption documentation standards
3. Include sensitivity analysis on key drivers
4. Track scenario accuracy over time
5. Maintain version control on scenarios
6. Ensure cross-functional alignment on assumptions
