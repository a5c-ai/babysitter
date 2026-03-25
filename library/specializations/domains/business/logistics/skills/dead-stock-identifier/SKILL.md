---
name: dead-stock-identifier
description: Slow-moving and obsolete inventory identification skill with disposition planning and working capital optimization
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
  priority: medium
---

# Dead Stock Identifier

## Overview

The Dead Stock Identifier is a skill that identifies slow-moving and obsolete inventory, develops disposition strategies, and optimizes working capital. It analyzes velocity patterns, aging, and market conditions to recommend appropriate actions for excess inventory while maximizing value recovery.

## Capabilities

- **Velocity Analysis and Aging**: Analyze item velocity trends and inventory aging to identify slow-moving and dead stock
- **Obsolescence Risk Scoring**: Calculate obsolescence risk scores based on lifecycle stage, technology changes, and market trends
- **Disposition Strategy Recommendation**: Recommend optimal disposition paths including markdown, liquidation, or donation
- **Markdown Optimization**: Determine optimal markdown levels and timing to maximize recovery
- **Liquidation Channel Matching**: Match excess inventory with appropriate liquidation channels and buyers
- **Write-Off Impact Analysis**: Calculate financial impact of write-offs and timing considerations
- **SKU Rationalization Support**: Support decisions on SKU discontinuation and assortment optimization

## Tools and Libraries

- Inventory Analytics
- Markdown Optimization Tools
- Liquidation Platforms
- Financial Analysis Libraries

## Used By Processes

- Dead Stock and Excess Inventory Management
- ABC-XYZ Analysis
- Cycle Counting Program

## Usage

```yaml
skill: dead-stock-identifier
inputs:
  inventory:
    - sku: "SKU001"
      description: "Widget A"
      quantity_on_hand: 500
      unit_cost: 25.00
      last_sale_date: "2025-06-15"
      monthly_sales_history: [5, 3, 2, 1, 0, 0, 0, 0]
      product_lifecycle: "declining"
    - sku: "SKU002"
      description: "Widget B"
      quantity_on_hand: 200
      unit_cost: 50.00
      last_sale_date: "2024-12-01"
      monthly_sales_history: [0, 0, 0, 0, 0, 0, 0, 0]
      product_lifecycle: "discontinued"
  analysis_parameters:
    slow_moving_threshold_days: 90
    dead_stock_threshold_days: 180
    holding_cost_percent: 25
outputs:
  inventory_analysis:
    - sku: "SKU001"
      classification: "slow_moving"
      days_since_last_sale: 224
      months_of_supply: 100
      inventory_value: 12500.00
      annual_holding_cost: 3125.00
      obsolescence_risk: "medium"
      disposition_recommendation:
        action: "markdown"
        suggested_discount: 40
        expected_recovery: 7500.00
        expected_liquidation_time_days: 60
    - sku: "SKU002"
      classification: "dead_stock"
      days_since_last_sale: 420
      months_of_supply: "infinite"
      inventory_value: 10000.00
      annual_holding_cost: 2500.00
      obsolescence_risk: "high"
      disposition_recommendation:
        action: "liquidate"
        liquidation_channel: "B-stock_marketplace"
        expected_recovery: 2000.00
        expected_liquidation_time_days: 30
  summary:
    total_slow_moving_value: 12500.00
    total_dead_stock_value: 10000.00
    total_annual_holding_cost: 5625.00
    total_expected_recovery: 9500.00
    total_write_off_exposure: 13000.00
```

## Integration Points

- Enterprise Resource Planning (ERP) Systems
- Inventory Management Systems
- E-commerce Platforms
- Liquidation Marketplaces
- Financial Systems

## Performance Metrics

- Dead stock percentage
- Inventory turnover
- Write-off rate
- Recovery rate
- Working capital released
