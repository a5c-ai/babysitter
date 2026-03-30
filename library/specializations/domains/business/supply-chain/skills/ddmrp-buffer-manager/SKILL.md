---
name: ddmrp-buffer-manager
description: Demand-Driven MRP buffer positioning and management skill with dynamic adjustment
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: inventory
  priority: future
---

# DDMRP Buffer Manager

## Overview

The DDMRP Buffer Manager implements Demand-Driven Material Requirements Planning methodology for inventory management. It handles strategic buffer positioning, zone calculations, dynamic adjustments, and execution prioritization to create flow-based material planning.

## Capabilities

- **Strategic Decoupling Point Identification**: Optimal buffer location selection
- **Buffer Profile Assignment**: Categorize items by lead time and variability
- **Buffer Level Calculation**: Green, yellow, red zone determination
- **Dynamic Adjustment Factors**: Planned and recalculated adjustments
- **Net Flow Position Calculation**: Real-time inventory position
- **Execution Visibility and Prioritization**: Color-coded supply priorities
- **Buffer Health Monitoring**: On-target percentage tracking
- **Lead Time Compression Analysis**: Identify lead time reduction opportunities

## Input Schema

```yaml
ddmrp_request:
  items: array
    - sku_id: string
      average_daily_usage: float
      decoupled_lead_time: integer
      minimum_order_quantity: integer
      variability_factor: string    # low, medium, high
      lead_time_factor: string      # short, medium, long
  bom_structure: object
  planned_adjustments: array        # Promotions, seasonality
  current_positions: array
  calculation_scope: string         # positioning, sizing, execution
```

## Output Schema

```yaml
ddmrp_output:
  buffer_positions: array
    - sku_id: string
      is_decoupling_point: boolean
      rationale: string
  buffer_levels: array
    - sku_id: string
      buffer_profile: string
      zones:
        green: integer
        yellow: integer
        red: integer
        red_safety: integer
      total_buffer: integer
  execution_priorities: array
    - sku_id: string
      net_flow_position: integer
      net_flow_equation: string
      priority_color: string
      on_hand: integer
      on_order: integer
      qualified_demand: integer
  buffer_health: object
```

## Usage

### Buffer Positioning Analysis

```
Input: BOM structure, lead times, demand variability
Process: Identify strategic inventory positioning points
Output: Recommended decoupling points with rationale
```

### Buffer Sizing Calculation

```
Input: ADU, lead time factors, variability factors
Process: Calculate zone sizes using DDMRP formulas
Output: Green, yellow, red zone levels by buffer
```

### Execution Priority Management

```
Input: Current inventory, orders, qualified demand
Process: Calculate net flow position, assign priority color
Output: Prioritized replenishment recommendations
```

## Integration Points

- **DDMRP Platforms**: Demand Driven Technologies, Replenishment+
- **ERP Systems**: BOM, inventory, demand data
- **Planning Systems**: Qualified demand, supply orders
- **Tools/Libraries**: DDMRP algorithms, flow optimization

## Process Dependencies

- Demand-Driven Material Requirements Planning (DDMRP)
- Inventory Optimization and Segmentation
- Safety Stock Calculation and Optimization

## Best Practices

1. Start with pilot categories before full rollout
2. Validate decoupling point selection with operations
3. Monitor buffer health daily during transition
4. Train planners on net flow execution
5. Review dynamic adjustment factors seasonally
6. Track lead time compression progress
