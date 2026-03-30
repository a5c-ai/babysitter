---
name: capacity-planner
description: Capacity requirements planning skill with demand-capacity gap analysis and capacity strategy recommendations
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

# Capacity Planner

## Overview

The Capacity Planner skill provides comprehensive capabilities for capacity requirements planning. It supports demand-capacity gap analysis, strategy modeling, resource loading analysis, and what-if scenario analysis to ensure adequate capacity for meeting customer demand.

## Capabilities

- Capacity requirements calculation
- Demand forecast integration
- Gap analysis visualization
- Lead, lag, match strategy modeling
- Resource loading analysis
- Rough-cut capacity planning
- What-if scenario analysis
- Capacity investment justification

## Used By Processes

- CAP-001: Capacity Requirements Planning
- CAP-003: Sales and Operations Planning
- CAP-002: Production Scheduling Optimization

## Tools and Libraries

- ERP/MRP systems
- Capacity planning software
- Forecasting tools
- Scenario modeling platforms

## Usage

```yaml
skill: capacity-planner
inputs:
  planning_horizon: 12  # months
  demand_forecast:
    - month: 1
      units: 10000
    - month: 2
      units: 11000
    # ... additional months
  resource_capacities:
    - resource: "Assembly Line 1"
      available_hours: 160
      efficiency: 0.85
      units_per_hour: 50
    - resource: "Assembly Line 2"
      available_hours: 160
      efficiency: 0.80
      units_per_hour: 45
  capacity_options:
    - option: "Add overtime"
      cost: 1.5  # multiplier
      capacity_increase: 25  # percent
    - option: "New equipment"
      cost: 500000
      capacity_increase: 100  # percent
outputs:
  - capacity_requirements
  - gap_analysis
  - resource_loading
  - strategy_recommendations
  - investment_analysis
```

## Capacity Planning Process

### Step 1: Calculate Requirements
```
Capacity Required = Demand / (Units per Hour x Efficiency)

Example:
- Demand: 10,000 units
- Rate: 50 units/hour
- Efficiency: 85%
- Required: 10,000 / (50 x 0.85) = 235 hours
```

### Step 2: Assess Available Capacity
```
Effective Capacity = Available Hours x Efficiency x Utilization Target
```

### Step 3: Identify Gaps
```
Capacity Gap = Capacity Required - Effective Capacity
```

## Capacity Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| Lead | Build capacity ahead of demand | Growth markets, competitive advantage |
| Lag | Add capacity after demand materializes | Uncertain demand, capital constraints |
| Match | Incrementally add capacity | Moderate growth, balanced approach |

## Resource Loading Analysis

| Load Level | % Utilization | Action |
|------------|---------------|--------|
| Under-loaded | < 70% | Consider reduction or consolidation |
| Optimal | 70-85% | Maintain current state |
| Fully loaded | 85-95% | Monitor closely, plan additions |
| Over-loaded | > 95% | Immediate action required |

## What-If Scenarios

Common scenarios to analyze:
1. Demand increase of 20%
2. Equipment breakdown
3. Labor shortage
4. New product introduction
5. Seasonal peak periods

## Integration Points

- ERP/MRP systems
- Demand planning systems
- Financial planning tools
- HR workforce planning
