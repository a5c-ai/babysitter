---
name: warehouse-simulation-modeler
description: Discrete event simulation skill for warehouse design validation and capacity planning
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
  priority: lower
  shared-candidate: true
---

# Warehouse Simulation Modeler

## Overview

The Warehouse Simulation Modeler provides discrete event simulation capabilities for warehouse design validation and capacity planning. It models warehouse processes, identifies bottlenecks, and evaluates scenarios to support investment decisions and operational improvements.

## Capabilities

- **Process Flow Simulation**: Simulate end-to-end warehouse processes including receiving, putaway, picking, packing, and shipping
- **Bottleneck Identification**: Identify process bottlenecks and constraints limiting throughput
- **Capacity Scenario Modeling**: Model capacity under different demand scenarios and operational assumptions
- **Equipment Utilization Analysis**: Analyze utilization of material handling equipment and identify optimization opportunities
- **Labor Requirement Forecasting**: Forecast labor requirements based on volume projections and process models
- **Layout Optimization Testing**: Test and compare warehouse layout alternatives through simulation
- **ROI Calculation for Automation**: Calculate return on investment for automation and technology investments

## Tools and Libraries

- SimPy
- AnyLogic
- FlexSim
- Arena
- Python Simulation Libraries

## Used By Processes

- Slotting Optimization
- Warehouse Labor Management
- Pick-Pack-Ship Operations

## Usage

```yaml
skill: warehouse-simulation-modeler
inputs:
  warehouse:
    facility_id: "DC001"
    square_footage: 250000
    layout:
      receiving_docks: 10
      shipping_docks: 15
      pick_modules: 3
      storage_racks: 5000
  processes:
    receiving:
      pallets_per_hour: 50
      putaway_time_minutes: 8
    picking:
      lines_per_hour: 45
      zones: 4
    packing:
      orders_per_hour: 30
      stations: 10
    shipping:
      pallets_per_hour: 60
  resources:
    forklifts: 15
    pickers: 40
    packers: 25
  scenarios:
    - name: "Current State"
      daily_orders: 5000
      daily_inbound_pallets: 200
    - name: "Peak Season"
      daily_orders: 8500
      daily_inbound_pallets: 350
    - name: "With Automation"
      daily_orders: 8500
      automation:
        goods_to_person: true
        auto_packing: true
outputs:
  simulation_results:
    - scenario: "Current State"
      throughput:
        orders_completed: 5000
        completion_rate: 100
        average_cycle_time_hours: 4.2
      utilization:
        forklifts: 72
        pickers: 85
        packers: 78
        receiving_docks: 65
        shipping_docks: 70
      bottlenecks: []
    - scenario: "Peak Season"
      throughput:
        orders_completed: 7200
        completion_rate: 84.7
        average_cycle_time_hours: 8.5
      utilization:
        forklifts: 95
        pickers: 98
        packers: 92
        receiving_docks: 90
        shipping_docks: 95
      bottlenecks:
        - resource: "pickers"
          constraint: "capacity"
          impact: "15% orders delayed"
        - resource: "shipping_docks"
          constraint: "capacity"
          impact: "carrier wait times increased"
    - scenario: "With Automation"
      throughput:
        orders_completed: 8500
        completion_rate: 100
        average_cycle_time_hours: 3.8
      utilization:
        goods_to_person_system: 82
        auto_packers: 75
        shipping_docks: 85
      bottlenecks: []
  investment_analysis:
    automation_investment: 5500000
    annual_labor_savings: 1800000
    throughput_increase: 18
    payback_period_years: 3.1
    five_year_roi: 64
  recommendations:
    - "Current capacity sufficient for baseline demand"
    - "Peak season requires 12 additional pickers or automation investment"
    - "Automation investment justified with 3.1 year payback"
    - "Consider adding 2 shipping docks for peak flexibility"
```

## Integration Points

- Warehouse Management Systems (WMS)
- Enterprise Resource Planning (ERP)
- CAD Systems (for layout)
- Financial Planning Systems
- Labor Management Systems

## Performance Metrics

- Simulation accuracy
- Throughput capacity
- Resource utilization
- Bottleneck identification
- Investment ROI accuracy
