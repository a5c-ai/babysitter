---
name: safety-stock-calculator
description: Dynamic safety stock and reorder point optimization skill based on demand variability, lead times, and service level targets
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
  category: inventory
  priority: high
---

# Safety Stock Calculator

## Overview

The Safety Stock Calculator is a dynamic skill that optimizes safety stock levels and reorder points based on demand variability, lead time uncertainty, and service level targets. It uses statistical methods and optimization algorithms to balance inventory investment against stockout risk.

## Capabilities

- **Service Level to Safety Stock Conversion**: Calculate required safety stock to achieve target service levels using statistical methods
- **Lead Time Variability Modeling**: Incorporate lead time uncertainty into safety stock calculations
- **Demand Variability Analysis**: Analyze demand patterns and variability to determine appropriate buffer stock
- **Reorder Point Calculation**: Calculate optimal reorder points combining expected demand and safety stock
- **Order Quantity Optimization (EOQ)**: Determine economic order quantities balancing ordering and holding costs
- **Min/Max Parameter Setting**: Set minimum and maximum inventory parameters for replenishment systems
- **Multi-Echelon Inventory Optimization**: Optimize inventory across multiple distribution tiers

## Tools and Libraries

- Inventory Optimization Libraries
- scipy (statistical functions)
- pyomo (optimization)
- NumPy/Pandas

## Used By Processes

- Reorder Point Calculation
- Demand Forecasting
- ABC-XYZ Analysis

## Usage

```yaml
skill: safety-stock-calculator
inputs:
  item:
    sku: "SKU001"
    unit_cost: 50.00
    holding_cost_percent: 25
    ordering_cost: 75.00
  demand:
    average_daily: 100
    standard_deviation: 15
    forecast_error_percent: 12
  lead_time:
    average_days: 5
    standard_deviation_days: 1
  service_level:
    target_percent: 98.0
    stockout_cost: 25.00
outputs:
  calculations:
    safety_stock_units: 87
    reorder_point: 587
    economic_order_quantity: 548
    min_level: 587
    max_level: 1135
  inventory_parameters:
    average_inventory: 361
    annual_holding_cost: 4512.50
    annual_ordering_cost: 4987.50
    total_annual_cost: 9500.00
  service_analysis:
    expected_service_level: 98.2
    expected_stockouts_per_year: 0.8
    expected_stockout_quantity: 42
  recommendations:
    review_frequency: "daily"
    next_review_date: "2026-01-26"
    suggested_order_quantity: 548
```

## Integration Points

- Enterprise Resource Planning (ERP) Systems
- Inventory Management Systems
- Demand Planning Systems
- Procurement Systems
- Warehouse Management Systems (WMS)

## Performance Metrics

- Service level achievement
- Inventory turns
- Stockout frequency
- Excess inventory value
- Safety stock accuracy
