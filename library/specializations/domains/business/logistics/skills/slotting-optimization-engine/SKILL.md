---
name: slotting-optimization-engine
description: AI-driven warehouse slotting skill to optimize product placement based on velocity, pick frequency, and operational efficiency
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
  priority: medium
---

# Slotting Optimization Engine

## Overview

The Slotting Optimization Engine is an AI-driven skill that optimizes warehouse product placement based on velocity, pick frequency, and operational efficiency. It analyzes product characteristics, order patterns, and warehouse layout to recommend optimal slot assignments that minimize travel time and maximize picking productivity.

## Capabilities

- **Velocity-Based Slot Assignment**: Assign fast-moving items to prime picking locations based on historical velocity data
- **Travel Distance Minimization**: Optimize slot locations to reduce average travel distance per pick
- **Ergonomic Zone Optimization**: Place heavy or frequently picked items at ergonomically optimal heights to reduce worker strain
- **Pick Path Efficiency Analysis**: Analyze and optimize slot assignments based on typical pick path patterns
- **Seasonal Demand Adjustment**: Adjust slotting recommendations based on seasonal demand patterns and promotional calendars
- **Product Affinity Clustering**: Group frequently co-ordered items in proximity to reduce pick travel
- **Golden Zone Placement**: Strategically utilize prime picking zones for highest-velocity items

## Tools and Libraries

- WMS APIs
- Slotting Optimization Algorithms
- Heuristic Solvers
- Data Analytics Libraries

## Used By Processes

- Slotting Optimization
- Pick-Pack-Ship Operations
- Receiving and Putaway Optimization

## Usage

```yaml
skill: slotting-optimization-engine
inputs:
  warehouse:
    warehouse_id: "WH001"
    zones:
      - zone_id: "ZONE_A"
        type: "pick_module"
        locations: 500
        golden_zone_locations: 100
      - zone_id: "ZONE_B"
        type: "bulk_storage"
        locations: 200
  products:
    - sku: "SKU001"
      velocity_class: "A"
      picks_per_day: 150
      cube: 0.5
      weight_lbs: 2.5
      stackable: true
    - sku: "SKU002"
      velocity_class: "B"
      picks_per_day: 45
      cube: 1.2
      weight_lbs: 8.0
      stackable: false
  constraints:
    optimize_for: "travel_time"
    respect_product_families: true
    ergonomic_weight_limit_lbs: 25
outputs:
  slot_recommendations:
    - sku: "SKU001"
      recommended_location: "A-01-02-A"
      zone: "ZONE_A"
      reason: "High velocity - golden zone placement"
      expected_picks_reduction: 15
    - sku: "SKU002"
      recommended_location: "A-05-03-B"
      zone: "ZONE_A"
      reason: "Medium velocity - mid-zone placement"
      expected_picks_reduction: 8
  projected_improvement:
    travel_time_reduction_percent: 12.5
    picks_per_hour_increase: 8.3
```

## Integration Points

- Warehouse Management Systems (WMS)
- Inventory Management Systems
- Labor Management Systems
- Order Management Systems
- Slotting Analysis Tools

## Performance Metrics

- Picks per hour improvement
- Travel distance reduction
- Slot utilization rate
- Replenishment frequency
- Ergonomic compliance rate
