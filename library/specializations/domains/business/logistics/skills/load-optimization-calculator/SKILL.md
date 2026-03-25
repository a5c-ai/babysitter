---
name: load-optimization-calculator
description: AI-powered load building and consolidation skill to maximize trailer utilization and reduce transportation costs
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
  category: transportation
  priority: medium
---

# Load Optimization Calculator

## Overview

The Load Optimization Calculator is an AI-powered skill that optimizes load building and freight consolidation to maximize trailer utilization and reduce transportation costs. It uses advanced 3D bin packing algorithms and considers weight distribution, stackability rules, and multi-stop sequencing requirements.

## Capabilities

- **3D Bin Packing Algorithms**: Apply sophisticated algorithms to optimize the placement of items within trailer or container space
- **Weight Distribution Optimization**: Ensure proper weight distribution for safe transport and compliance with axle weight regulations
- **Stackability and Compatibility Rules**: Enforce product stacking rules, fragility constraints, and incompatibility restrictions
- **Multi-Stop Load Sequencing**: Arrange loads in reverse delivery order for efficient unloading at multiple stops
- **Trailer Cube Utilization Maximization**: Optimize for maximum cubic space utilization while respecting weight limits
- **Mixed Freight Consolidation**: Combine shipments from multiple orders or customers for full truckload efficiency
- **Pool Distribution Planning**: Plan optimal consolidation points and pool distribution strategies

## Tools and Libraries

- 3D Packing Libraries (py3dbp, rectpack)
- Optimization Solvers (Google OR-Tools, CPLEX)
- TMS Integration APIs
- CAD/Visualization Libraries

## Used By Processes

- Load Planning and Consolidation
- Route Optimization
- Cross-Docking Operations

## Usage

```yaml
skill: load-optimization-calculator
inputs:
  trailer:
    type: "53ft_dry_van"
    length_inches: 636
    width_inches: 102
    height_inches: 110
    max_weight_lbs: 45000
  shipments:
    - shipment_id: "SHP001"
      items:
        - sku: "ITEM001"
          length: 48
          width: 40
          height: 48
          weight: 500
          quantity: 4
          stackable: true
          max_stack: 2
      destination: "Stop 1"
    - shipment_id: "SHP002"
      items:
        - sku: "ITEM002"
          length: 48
          width: 40
          height: 36
          weight: 350
          quantity: 6
          stackable: true
          max_stack: 3
      destination: "Stop 2"
  constraints:
    optimize_for: "cube_utilization"
    reverse_stop_order: true
outputs:
  load_plan:
    total_weight_lbs: 4100
    weight_utilization: 9.1
    cube_utilization: 68.5
    placements:
      - item_id: "SHP002-ITEM002-1"
        position: { x: 0, y: 0, z: 0 }
        orientation: "length_first"
      - item_id: "SHP001-ITEM001-1"
        position: { x: 48, y: 0, z: 0 }
        orientation: "length_first"
    loading_sequence: ["SHP002", "SHP001"]
```

## Integration Points

- Transportation Management Systems (TMS)
- Warehouse Management Systems (WMS)
- Order Management Systems
- Yard Management Systems
- Load Visualization Tools

## Performance Metrics

- Cube utilization percentage
- Weight utilization percentage
- Shipments per load
- Cost per unit shipped
- Load planning time
