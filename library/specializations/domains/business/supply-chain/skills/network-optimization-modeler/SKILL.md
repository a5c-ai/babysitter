---
name: network-optimization-modeler
description: Supply chain network design and optimization skill using mathematical modeling
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

# Network Optimization Modeler

## Overview

The Network Optimization Modeler provides supply chain network design and optimization capabilities using mathematical modeling techniques. It supports facility location decisions, transportation lane optimization, inventory positioning, and cost-service tradeoff analysis.

## Capabilities

- **Center of Gravity Analysis**: Geographic demand-weighted location analysis
- **Mixed-Integer Linear Programming**: Optimization model formulation and solving
- **Facility Location Optimization**: Warehouse and distribution center placement
- **Transportation Lane Optimization**: Freight lane and mode optimization
- **Inventory Positioning by Node**: Multi-echelon inventory placement
- **Cost-Service Tradeoff Analysis**: Pareto frontier exploration
- **Scenario Modeling and Comparison**: What-if network configurations
- **Network Visualization**: Geographic and flow visualization

## Input Schema

```yaml
network_optimization_request:
  network_elements:
    suppliers: array
    facilities: array
      - facility_id: string
        type: string              # plant, DC, hub
        location: object
        capacity: float
        fixed_cost: float
        variable_cost: float
        status: string            # existing, candidate
    customers: array
    products: array
  demand_data:
    customer_demand: array
    seasonality: object
  cost_data:
    transportation_rates: array
    facility_costs: object
    inventory_costs: object
  constraints:
    service_levels: object
    capacity_constraints: object
    policy_constraints: array
  optimization_objective: string    # minimize_cost, maximize_service, balanced
  scenarios: array
```

## Output Schema

```yaml
network_optimization_output:
  optimal_network:
    facilities:
      open_facilities: array
      closed_facilities: array
      capacity_utilization: object
    flows:
      sourcing_flows: array
      distribution_flows: array
    inventory_positioning: object
  cost_analysis:
    total_cost: float
    transportation_cost: float
    facility_cost: float
    inventory_cost: float
    cost_breakdown: object
  service_analysis:
    service_levels_achieved: object
    lead_times: object
  scenario_comparison: array
    - scenario_name: string
      total_cost: float
      service_level: float
      trade_offs: array
  sensitivity_analysis:
    key_drivers: array
    break_even_points: object
  visualizations:
    network_map: object
    flow_diagram: object
    cost_service_curve: object
  implementation_roadmap: object
```

## Usage

### Greenfield Network Design

```
Input: Customer locations, demand, candidate sites
Process: Optimize facility locations and flows
Output: Optimal network configuration with cost analysis
```

### Distribution Network Optimization

```
Input: Existing network, new demand patterns
Process: Evaluate reconfiguration options
Output: Recommended network changes with savings
```

### Scenario Analysis

```
Input: Multiple demand/cost scenarios
Process: Optimize network for each scenario
Output: Robust network recommendation
```

## Integration Points

- **Optimization Solvers**: AIMMS, Llamasoft, CPLEX, Gurobi
- **GIS Platforms**: Geographic analysis and visualization
- **ERP Systems**: Demand and cost data
- **Tools/Libraries**: AIMMS, Llamasoft, CPLEX, Gurobi, or-tools

## Process Dependencies

- Supply Chain Network Design
- Supply Chain Cost-to-Serve Analysis
- Capacity Planning and Constraint Management

## Best Practices

1. Validate model inputs thoroughly
2. Consider multiple scenarios and sensitivities
3. Balance optimization with practical constraints
4. Involve operations in solution validation
5. Plan phased implementation approach
6. Monitor actual vs. modeled performance
