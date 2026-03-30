---
name: abc-xyz-classifier
description: Multi-dimensional inventory classification skill combining value (ABC) and demand variability (XYZ) analysis for differentiated policies
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

# ABC-XYZ Classifier

## Overview

The ABC-XYZ Classifier is a multi-dimensional inventory classification skill that combines value-based (ABC) and demand variability (XYZ) analysis to enable differentiated inventory policies. It automates Pareto analysis and demand pattern classification to recommend optimal stocking strategies, service levels, and review frequencies.

## Capabilities

- **Pareto Analysis Automation**: Automatically classify inventory into A, B, C categories based on value contribution using Pareto principles
- **Demand Pattern Classification**: Analyze demand variability to classify items as X (stable), Y (variable), or Z (erratic)
- **Inventory Policy Recommendation**: Recommend appropriate inventory policies based on combined ABC-XYZ classification
- **Service Level Differentiation**: Suggest differentiated service level targets based on item classification and business importance
- **Review Frequency Optimization**: Determine optimal inventory review frequencies for each classification
- **Stocking Strategy Suggestions**: Recommend make-to-stock, make-to-order, or hybrid strategies based on classification
- **Cross-Docking Candidacy Identification**: Identify items suitable for cross-docking based on velocity and predictability

## Tools and Libraries

- Statistical Analysis Libraries (pandas, numpy)
- Inventory Optimization Models
- Data Visualization Libraries
- Classification Algorithms

## Used By Processes

- ABC-XYZ Analysis
- Reorder Point Calculation
- Dead Stock and Excess Inventory Management

## Usage

```yaml
skill: abc-xyz-classifier
inputs:
  inventory_data:
    - sku: "SKU001"
      annual_value: 150000
      monthly_demand: [100, 98, 102, 99, 101, 100, 98, 103, 99, 100, 101, 99]
      unit_cost: 125
    - sku: "SKU002"
      annual_value: 45000
      monthly_demand: [50, 75, 30, 60, 45, 80, 35, 55, 70, 40, 65, 50]
      unit_cost: 75
  classification_parameters:
    abc_thresholds:
      A: 80  # Top 80% of value
      B: 95  # Next 15% of value
    xyz_thresholds:
      X: 20  # CV < 20%
      Y: 50  # CV 20-50%
outputs:
  classifications:
    - sku: "SKU001"
      abc_class: "A"
      xyz_class: "X"
      combined_class: "AX"
      annual_value: 150000
      value_rank: 1
      cv_percent: 1.8
      recommendation:
        service_level: 99.5
        review_frequency: "daily"
        stocking_strategy: "make_to_stock"
        safety_stock_method: "statistical"
    - sku: "SKU002"
      abc_class: "B"
      xyz_class: "Y"
      combined_class: "BY"
      annual_value: 45000
      value_rank: 15
      cv_percent: 32.5
      recommendation:
        service_level: 97.0
        review_frequency: "weekly"
        stocking_strategy: "make_to_stock"
        safety_stock_method: "buffer"
  summary:
    AX_count: 45
    AY_count: 30
    AZ_count: 25
    BX_count: 150
    BY_count: 200
    BZ_count: 150
```

## Integration Points

- Enterprise Resource Planning (ERP) Systems
- Inventory Management Systems
- Demand Planning Systems
- Warehouse Management Systems (WMS)
- Financial Systems

## Performance Metrics

- Classification accuracy
- Policy compliance rate
- Service level achievement by class
- Inventory investment by class
- Turn rate by class
