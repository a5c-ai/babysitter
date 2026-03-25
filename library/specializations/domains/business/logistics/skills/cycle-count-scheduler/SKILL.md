---
name: cycle-count-scheduler
description: AI-driven cycle counting schedule and variance analysis skill to maintain inventory accuracy with minimal operational disruption
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

# Cycle Count Scheduler

## Overview

The Cycle Count Scheduler is an AI-driven skill that optimizes cycle counting schedules and performs variance analysis to maintain inventory accuracy with minimal operational disruption. It uses ABC classification, statistical sampling, and historical accuracy data to prioritize counting activities and identify root causes of inventory discrepancies.

## Capabilities

- **ABC-Based Count Frequency Determination**: Set count frequencies based on inventory value, velocity, and criticality classifications
- **Statistical Sampling Design**: Design statistically valid sampling plans that provide accuracy confidence with minimal counting effort
- **Count Schedule Optimization**: Schedule counts during low-activity periods to minimize operational disruption
- **Variance Threshold Alerting**: Monitor count variances against thresholds and trigger alerts for significant discrepancies
- **Root Cause Analysis Automation**: Analyze variance patterns to identify systemic issues and recommend corrective actions
- **Perpetual vs. Physical Reconciliation**: Compare perpetual inventory records with physical counts and manage adjustments
- **Audit Trail Documentation**: Maintain complete documentation of counts, variances, and adjustments for compliance

## Tools and Libraries

- WMS APIs
- Statistical Sampling Libraries
- Inventory Audit Tools
- Analytics Platforms

## Used By Processes

- Cycle Counting Program
- ABC-XYZ Analysis
- FIFO-LIFO Inventory Control

## Usage

```yaml
skill: cycle-count-scheduler
inputs:
  inventory_profile:
    total_skus: 5000
    abc_distribution:
      A_items: 500
      B_items: 1500
      C_items: 3000
  count_parameters:
    target_accuracy: 99.5
    counting_capacity_skus_per_day: 100
    available_count_days_per_week: 5
  current_accuracy:
    A_items: 98.5
    B_items: 97.8
    C_items: 96.2
outputs:
  count_schedule:
    - classification: "A"
      count_frequency: "weekly"
      skus_per_week: 100
      priority_skus: ["SKU001", "SKU002", "SKU003"]
    - classification: "B"
      count_frequency: "monthly"
      skus_per_week: 75
    - classification: "C"
      count_frequency: "quarterly"
      skus_per_week: 60
  weekly_schedule:
    monday: { zone: "ZONE_A", skus: 45 }
    tuesday: { zone: "ZONE_A", skus: 45 }
    wednesday: { zone: "ZONE_B", skus: 50 }
    thursday: { zone: "ZONE_B", skus: 50 }
    friday: { zone: "ZONE_C", skus: 45 }
  projected_accuracy_improvement:
    A_items: 99.8
    B_items: 99.2
    C_items: 98.5
```

## Integration Points

- Warehouse Management Systems (WMS)
- Inventory Management Systems
- Financial Systems (for adjustments)
- Compliance/Audit Systems
- Mobile Counting Devices

## Performance Metrics

- Inventory record accuracy (IRA)
- Count variance rate
- Adjustment dollar value
- Count productivity (SKUs per hour)
- Time to count completion
