---
name: returns-disposition-optimizer
description: AI-powered returns inspection and disposition decision skill maximizing value recovery
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
  category: returns
  priority: lower
---

# Returns Disposition Optimizer

## Overview

The Returns Disposition Optimizer is an AI-powered skill that optimizes returns inspection and disposition decisions to maximize value recovery. It automates condition grading, determines optimal disposition paths, and coordinates with secondary markets to extract maximum value from returned products.

## Capabilities

- **Condition Grading Automation**: Standardize and automate product condition assessment during inspection
- **Disposition Path Optimization**: Determine optimal disposition (restock, refurbish, liquidate, recycle) based on condition and market value
- **Value Recovery Maximization**: Optimize decisions to maximize financial recovery from returned items
- **Refurbishment Cost-Benefit Analysis**: Analyze whether refurbishment costs are justified by potential resale value
- **Secondary Market Matching**: Match products with appropriate liquidation or secondary market channels
- **Recycling and Disposal Routing**: Route non-recoverable items to appropriate recycling or disposal channels
- **Disposition Analytics**: Track and analyze disposition outcomes for continuous improvement

## Tools and Libraries

- Inspection Automation Tools
- Liquidation Platforms (B-Stock, Liquidity Services)
- Grading Systems
- Market Value APIs

## Used By Processes

- Returns Processing and Disposition
- Reverse Logistics Management
- Dead Stock and Excess Inventory Management

## Usage

```yaml
skill: returns-disposition-optimizer
inputs:
  returned_item:
    rma_number: "RMA-2026-54321"
    sku: "SKU001"
    original_price: 149.99
    return_reason: "defective"
    inspection_results:
      condition: "good"
      cosmetic_damage: "minor_scratches"
      functional_status: "fully_operational"
      packaging_status: "damaged"
      accessories_complete: true
  market_data:
    new_price: 149.99
    refurbished_price: 119.99
    liquidation_value: 45.00
    recycling_value: 2.50
  refurbishment_options:
    - type: "repackage"
      cost: 5.00
      resulting_grade: "open_box"
      expected_value: 129.99
    - type: "full_refurbishment"
      cost: 25.00
      resulting_grade: "refurbished"
      expected_value: 119.99
outputs:
  disposition_decision:
    recommended_disposition: "repackage_and_resell"
    disposition_channel: "open_box_marketplace"
    expected_recovery: 129.99
    processing_cost: 5.00
    net_recovery: 124.99
    recovery_rate_percent: 83.3
  alternative_options:
    - disposition: "liquidate"
      recovery: 45.00
      processing_cost: 2.00
      net_recovery: 43.00
    - disposition: "full_refurbishment"
      recovery: 119.99
      processing_cost: 25.00
      net_recovery: 94.99
  grading_details:
    assigned_grade: "B"
    grade_description: "Good condition with minor cosmetic wear"
    deductions:
      - reason: "packaging_damage"
        deduction_percent: 5
      - reason: "cosmetic_scratches"
        deduction_percent: 8
  routing:
    destination: "Refurb Center - Memphis"
    processing_priority: "standard"
    estimated_completion_days: 3
```

## Integration Points

- Warehouse Management Systems (WMS)
- Returns Management Systems
- E-commerce Platforms
- Liquidation Marketplaces
- Recycling Partners

## Performance Metrics

- Recovery rate percentage
- Processing cost per return
- Time to disposition
- Restock rate
- Liquidation value capture
