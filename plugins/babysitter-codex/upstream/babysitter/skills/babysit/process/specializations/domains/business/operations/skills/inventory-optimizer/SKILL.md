---
name: inventory-optimizer
description: Inventory management optimization skill with safety stock calculation, reorder point determination, and ABC analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: workflow-automation
---

# Inventory Optimizer

## Overview

The Inventory Optimizer skill provides comprehensive capabilities for optimizing inventory management. It supports ABC/XYZ classification, safety stock calculation, reorder point optimization, and service level optimization.

## Capabilities

- ABC/XYZ classification
- Safety stock calculation
- Reorder point optimization
- EOQ calculation
- Inventory turn analysis
- Dead stock identification
- Carrying cost analysis
- Service level optimization

## Used By Processes

- LEAN-004: Kanban System Design
- CAP-003: Sales and Operations Planning
- TOC-001: Constraint Identification and Exploitation

## Tools and Libraries

- Inventory management systems
- Optimization algorithms
- Demand forecasting tools
- ERP integration

## Usage

```yaml
skill: inventory-optimizer
inputs:
  items:
    - sku: "PART-001"
      annual_demand: 12000
      unit_cost: 25
      lead_time: 5  # days
      demand_variability: 0.15  # coefficient of variation
      holding_cost_rate: 0.25  # annual
      order_cost: 50
    - sku: "PART-002"
      annual_demand: 500
      unit_cost: 500
      lead_time: 20
      demand_variability: 0.30
      holding_cost_rate: 0.25
      order_cost: 75
  service_level_target: 0.95
  analysis_type: "comprehensive"
outputs:
  - abc_xyz_classification
  - safety_stock_recommendations
  - reorder_points
  - eoq_calculations
  - inventory_investment
  - service_level_analysis
```

## ABC/XYZ Classification

### ABC Analysis (Value)
| Class | % of Items | % of Value | Management |
|-------|------------|------------|------------|
| A | 10-20% | 70-80% | Tight control |
| B | 20-30% | 15-20% | Moderate control |
| C | 50-70% | 5-10% | Simple control |

### XYZ Analysis (Variability)
| Class | CV Range | Predictability | Approach |
|-------|----------|----------------|----------|
| X | 0-0.5 | High | Statistical |
| Y | 0.5-1.0 | Medium | Mixed |
| Z | >1.0 | Low | Manual |

## Safety Stock Calculation

```
Safety Stock = Z x Standard Deviation x Square Root(Lead Time)

Where:
- Z = Service level factor (1.65 for 95%)
- Standard Deviation = Demand variability
- Lead Time = Replenishment time

Example:
- Daily demand: 100 units
- Daily std dev: 15 units
- Lead time: 5 days
- Service level: 95% (Z = 1.65)

Safety Stock = 1.65 x 15 x sqrt(5) = 55 units
```

## Economic Order Quantity (EOQ)

```
EOQ = Square Root((2 x Annual Demand x Order Cost) / Holding Cost)

Example:
- Annual demand: 12,000 units
- Order cost: $50
- Unit cost: $25
- Holding rate: 25%

Holding cost = $25 x 0.25 = $6.25

EOQ = sqrt((2 x 12,000 x 50) / 6.25) = 438 units
```

## Reorder Point

```
Reorder Point = (Average Daily Demand x Lead Time) + Safety Stock

Example:
- Daily demand: 100 units
- Lead time: 5 days
- Safety stock: 55 units

Reorder Point = (100 x 5) + 55 = 555 units
```

## Inventory Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Inventory Turns | COGS / Average Inventory | Industry benchmark |
| Days of Supply | Inventory / Daily Usage | Per policy |
| Fill Rate | Orders filled from stock | >95% |
| Carrying Cost | Average Inventory x Rate | Minimize |

## Integration Points

- ERP/inventory systems
- Demand planning systems
- Warehouse management
- Procurement systems
