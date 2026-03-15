---
name: logistics-kpi-tracker
description: Comprehensive logistics performance measurement skill with KPI tracking, benchmarking, and improvement recommendations
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
  priority: medium
  shared-candidate: true
---

# Logistics KPI Tracker

## Overview

The Logistics KPI Tracker provides comprehensive logistics performance measurement with KPI tracking, benchmarking, and improvement recommendations. It monitors key metrics across all logistics functions and identifies opportunities for operational improvement.

## Capabilities

- **OTIF (On-Time In-Full) Tracking**: Track on-time and in-full delivery performance against commitments
- **Perfect Order Rate Calculation**: Calculate perfect order rates considering all order fulfillment dimensions
- **Fill Rate Analysis**: Monitor fill rates at order, line, and unit levels
- **Order Cycle Time Measurement**: Track order cycle times from order placement to delivery
- **Cost Per Order/Unit Tracking**: Calculate and monitor logistics costs at various levels
- **Benchmark Comparison**: Compare performance against industry benchmarks and best practices
- **Improvement Opportunity Identification**: Identify areas for operational improvement based on KPI analysis

## Tools and Libraries

- BI Platforms (Tableau, Power BI)
- Data Warehousing
- Logistics Dashboards
- Statistical Analysis Libraries

## Used By Processes

- All logistics processes (cross-cutting)

## Usage

```yaml
skill: logistics-kpi-tracker
inputs:
  reporting_period:
    start: "2026-01-01"
    end: "2026-01-24"
  data_sources:
    orders: true
    shipments: true
    inventory: true
    costs: true
  benchmarks:
    otif: 95.0
    perfect_order_rate: 90.0
    fill_rate: 98.0
    order_cycle_time_days: 3.0
    cost_per_order: 12.50
  comparison:
    prior_period: true
    prior_year: true
outputs:
  kpi_summary:
    otif:
      actual: 93.5
      target: 95.0
      variance: -1.5
      trend: "improving"
      prior_period: 92.8
      prior_year: 91.2
    perfect_order_rate:
      actual: 88.2
      target: 90.0
      variance: -1.8
      trend: "stable"
      components:
        on_time: 93.5
        in_full: 96.2
        damage_free: 99.1
        accurate_documentation: 98.5
    fill_rate:
      actual: 97.5
      target: 98.0
      variance: -0.5
      trend: "stable"
    order_cycle_time:
      actual_days: 2.8
      target_days: 3.0
      variance: 0.2
      trend: "improving"
    cost_per_order:
      actual: 11.85
      target: 12.50
      variance: 0.65
      trend: "improving"
  performance_breakdown:
    by_channel:
      ecommerce: { otif: 91.2, fill_rate: 96.8 }
      wholesale: { otif: 95.8, fill_rate: 98.2 }
      retail: { otif: 94.1, fill_rate: 97.8 }
    by_region:
      northeast: { otif: 94.5, fill_rate: 98.1 }
      southeast: { otif: 92.8, fill_rate: 97.0 }
      midwest: { otif: 93.9, fill_rate: 97.5 }
  improvement_opportunities:
    - area: "On-Time Delivery"
      current: 93.5
      target: 95.0
      gap: 1.5
      root_causes:
        - "Carrier performance in Southeast region"
        - "Dock congestion at DC002"
      recommendations:
        - "Carrier performance review with underperformers"
        - "Implement dock scheduling system at DC002"
      potential_improvement: 2.0
    - area: "Fill Rate"
      current: 97.5
      target: 98.0
      gap: 0.5
      root_causes:
        - "Safety stock levels insufficient for high-velocity items"
      recommendations:
        - "Review and adjust safety stock for A-class items"
      potential_improvement: 0.8
```

## Integration Points

- Enterprise Resource Planning (ERP)
- Warehouse Management Systems (WMS)
- Transportation Management Systems (TMS)
- Order Management Systems
- Business Intelligence Platforms

## Performance Metrics

- OTIF percentage
- Perfect order rate
- Fill rate
- Order cycle time
- Cost per order
