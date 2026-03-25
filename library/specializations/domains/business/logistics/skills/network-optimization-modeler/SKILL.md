---
name: network-optimization-modeler
description: Strategic distribution network modeling skill to optimize facility locations, capacity allocation, and inventory positioning
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
  category: distribution
  priority: medium
  shared-candidate: true
---

# Network Optimization Modeler

## Overview

The Network Optimization Modeler is a strategic skill that optimizes distribution network design including facility locations, capacity allocation, and inventory positioning. It uses advanced modeling techniques to evaluate scenarios and recommend network configurations that minimize cost while meeting service requirements.

## Capabilities

- **Facility Location Optimization**: Determine optimal locations for distribution centers, fulfillment centers, and warehouses
- **Network Cost-to-Serve Modeling**: Model total cost-to-serve including transportation, inventory, and facility costs
- **Capacity Planning and Allocation**: Optimize capacity allocation across facilities and identify expansion needs
- **Scenario Analysis (Greenfield, Brownfield)**: Evaluate network redesign scenarios from scratch or building on existing infrastructure
- **Service Level Impact Assessment**: Analyze the service level implications of network design decisions
- **Carbon Footprint Modeling**: Incorporate sustainability metrics into network optimization decisions
- **Risk and Resilience Analysis**: Evaluate network resilience to disruptions and identify vulnerability points

## Tools and Libraries

- Network Optimization Solvers (Llamasoft, AIMMS)
- Simulation Tools
- GIS Libraries
- Optimization Libraries (Gurobi, CPLEX)

## Used By Processes

- Distribution Network Optimization
- Cross-Docking Operations
- Multi-Channel Fulfillment

## Usage

```yaml
skill: network-optimization-modeler
inputs:
  current_network:
    facilities:
      - facility_id: "DC001"
        location: "Chicago, IL"
        type: "distribution_center"
        capacity_pallets: 50000
        annual_cost: 2500000
      - facility_id: "DC002"
        location: "Dallas, TX"
        type: "distribution_center"
        capacity_pallets: 35000
        annual_cost: 1800000
  demand:
    regions:
      - region: "Northeast"
        annual_demand_pallets: 75000
        service_requirement_days: 2
      - region: "Southeast"
        annual_demand_pallets: 60000
        service_requirement_days: 2
  constraints:
    max_facilities: 5
    budget_capex: 10000000
    min_service_level_percent: 95
  scenarios:
    - name: "Add West Coast DC"
      candidate_locations: ["Los Angeles, CA", "Phoenix, AZ"]
    - name: "Expand Chicago"
      expansion_capacity: 25000
outputs:
  recommended_network:
    scenario: "Add West Coast DC"
    facilities:
      - facility_id: "DC001"
        status: "existing"
        utilization: 85
      - facility_id: "DC002"
        status: "existing"
        utilization: 78
      - facility_id: "DC003"
        location: "Los Angeles, CA"
        status: "new"
        capacity_pallets: 40000
        capex: 5000000
  metrics:
    total_annual_cost: 12500000
    cost_savings_vs_current: 1200000
    service_level_achieved: 97.5
    average_transit_days: 1.8
    carbon_reduction_percent: 12
  scenario_comparison:
    - scenario: "Current State"
      cost: 13700000
      service_level: 92.0
    - scenario: "Add West Coast DC"
      cost: 12500000
      service_level: 97.5
```

## Integration Points

- Strategic Planning Systems
- Transportation Management Systems (TMS)
- Warehouse Management Systems (WMS)
- Financial Planning Systems
- GIS/Mapping Services

## Performance Metrics

- Total cost-to-serve
- Service level coverage
- Facility utilization
- Network efficiency index
- Carbon footprint per unit
