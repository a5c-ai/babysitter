---
name: inventory-optimizer
description: Multi-echelon inventory optimization skill with ABC/XYZ segmentation and service level targeting
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
  priority: high
---

# Inventory Optimizer

## Overview

The Inventory Optimizer provides comprehensive inventory optimization capabilities including segmentation, service level targeting, and multi-echelon optimization. It balances inventory investment against service levels to maximize supply chain performance.

## Capabilities

- **ABC/XYZ Inventory Classification**: Segment by value and demand variability
- **Service Level to Inventory Tradeoff**: Model cost-service curves
- **Multi-Echelon Inventory Optimization**: Optimize across network tiers
- **Safety Stock Calculation**: Demand and lead time variability-based
- **Reorder Point and EOQ Optimization**: Economic order quantity analysis
- **Slow-Moving/Obsolete Identification**: SLOB analysis and disposition
- **Inventory Investment Optimization**: Working capital optimization
- **Network Inventory Rebalancing**: Cross-location optimization

## Input Schema

```yaml
inventory_optimization_request:
  items: array
    - sku_id: string
      annual_usage_value: float
      demand_history: array
      lead_time: integer
      unit_cost: float
      current_stock: integer
  service_level_targets: object
  network_locations: array
  cost_parameters:
    carrying_cost_rate: float
    ordering_cost: float
    stockout_cost: float
  optimization_objectives: array
```

## Output Schema

```yaml
inventory_optimization_output:
  segmentation:
    abc_classification: object
    xyz_classification: object
    abc_xyz_matrix: object
  optimal_parameters: array
    - sku_id: string
      safety_stock: integer
      reorder_point: integer
      order_quantity: integer
      service_level: float
  investment_analysis:
    current_investment: float
    optimal_investment: float
    reduction_potential: float
  slob_analysis:
    slow_moving: array
    obsolete: array
    disposition_recommendations: array
  network_rebalancing: object
```

## Usage

### ABC/XYZ Segmentation

```
Input: SKU master with annual usage and demand history
Process: Calculate value classification (ABC) and variability (XYZ)
Output: Nine-box segmentation with policy recommendations
```

### Safety Stock Optimization

```
Input: Demand variability, lead time variability, service targets
Process: Calculate optimal safety stock by segment
Output: Safety stock quantities with investment impact
```

### Network Inventory Balance

```
Input: Multi-location inventory positions, demand by location
Process: Identify imbalances and rebalancing opportunities
Output: Transfer recommendations with cost savings
```

## Integration Points

- **ERP Systems**: Inventory data, transactions, master data
- **Planning Systems**: Demand forecasts, supply plans
- **Optimization Solvers**: scipy, CPLEX, Gurobi
- **Tools/Libraries**: scipy optimization, inventory algorithms

## Process Dependencies

- Inventory Optimization and Segmentation
- Safety Stock Calculation and Optimization
- Demand-Driven Material Requirements Planning (DDMRP)

## Best Practices

1. Refresh segmentation quarterly
2. Validate demand variability calculations
3. Consider service differentiation by customer segment
4. Monitor fill rate vs. inventory investment tradeoffs
5. Establish SLOB review cadence
6. Document policy rationale for auditing
