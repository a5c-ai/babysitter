---
name: wave-planning-optimizer
description: Automated wave planning and pick path optimization skill to maximize warehouse throughput and order accuracy
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
  category: warehouse
  priority: high
---

# Wave Planning Optimizer

## Overview

The Wave Planning Optimizer is an automated skill that optimizes wave planning and pick path sequencing to maximize warehouse throughput and order accuracy. It intelligently groups orders into waves, balances workloads, and coordinates with carrier cutoff times to ensure efficient fulfillment operations.

## Capabilities

- **Wave Release Optimization**: Determine optimal wave sizes and release timing based on capacity, demand, and carrier schedules
- **Batch Picking Strategies**: Group orders into efficient batches based on location proximity, order similarity, and resource availability
- **Pick Path Sequencing**: Optimize the sequence of picks within a batch to minimize travel distance
- **Carrier Cutoff Coordination**: Align wave releases with carrier pickup schedules and service commitments
- **Resource Capacity Balancing**: Distribute work evenly across available pickers and zones to prevent bottlenecks
- **Zone Picking Orchestration**: Coordinate picks across multiple zones for efficient zone-based picking strategies
- **Pick Density Optimization**: Maximize picks per travel unit by optimizing batch composition

## Tools and Libraries

- WMS Systems
- Optimization Algorithms
- Scheduling Tools
- Resource Planning Libraries

## Used By Processes

- Pick-Pack-Ship Operations
- Receiving and Putaway Optimization
- Warehouse Labor Management

## Usage

```yaml
skill: wave-planning-optimizer
inputs:
  orders:
    - order_id: "ORD001"
      lines: 3
      priority: "standard"
      carrier_cutoff: "14:00"
      zone_requirements: ["ZONE_A", "ZONE_B"]
    - order_id: "ORD002"
      lines: 5
      priority: "expedited"
      carrier_cutoff: "12:00"
      zone_requirements: ["ZONE_A"]
  resources:
    available_pickers: 10
    picker_capacity_lines_per_hour: 60
  constraints:
    max_wave_size: 200
    batch_size_target: 12
    planning_horizon_hours: 4
outputs:
  waves:
    - wave_id: "WAVE001"
      release_time: "08:00"
      orders: ["ORD002", "ORD003", "ORD004"]
      total_lines: 45
      estimated_completion: "09:30"
      assigned_pickers: 3
      batches:
        - batch_id: "BATCH001"
          orders: ["ORD002"]
          pick_sequence: ["A-01-02", "A-03-05", "A-04-01"]
    - wave_id: "WAVE002"
      release_time: "09:30"
      orders: ["ORD001", "ORD005"]
      total_lines: 38
      estimated_completion: "11:00"
      assigned_pickers: 3
  metrics:
    total_waves: 2
    average_batch_size: 10.5
    estimated_throughput_lines_per_hour: 85
```

## Integration Points

- Warehouse Management Systems (WMS)
- Order Management Systems
- Labor Management Systems
- Transportation Management Systems (TMS)
- Carrier Systems

## Performance Metrics

- Lines picked per hour
- Wave completion rate
- Order cycle time
- Carrier cutoff compliance
- Resource utilization rate
