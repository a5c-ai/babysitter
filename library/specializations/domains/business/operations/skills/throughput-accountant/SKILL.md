---
name: throughput-accountant
description: TOC financial metrics skill for throughput, inventory, and operating expense analysis with decision support
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: theory-of-constraints
---

# Throughput Accountant

## Overview

The Throughput Accountant skill provides comprehensive capabilities for applying Theory of Constraints financial metrics. It supports throughput, inventory, and operating expense analysis to drive better operational and investment decisions.

## Capabilities

- Throughput calculation (T)
- Inventory valuation (I)
- Operating expense tracking (OE)
- Net profit computation
- ROI analysis
- Product mix optimization
- Make vs. buy decisions
- Investment justification

## Used By Processes

- TOC-003: Throughput Accounting Analysis
- TOC-001: Constraint Identification and Exploitation
- CAP-001: Capacity Requirements Planning

## Tools and Libraries

- Financial analysis tools
- ERP integration
- Decision support systems
- Optimization software

## Usage

```yaml
skill: throughput-accountant
inputs:
  products:
    - name: "Product A"
      selling_price: 100
      raw_material_cost: 30
      constraint_time: 10  # minutes
    - name: "Product B"
      selling_price: 150
      raw_material_cost: 60
      constraint_time: 20  # minutes
  constraint_capacity: 480  # minutes per day
  operating_expenses: 5000  # per day
  investment_options:
    - description: "Add second constraint machine"
      cost: 100000
      throughput_increase: 50  # percent
outputs:
  - throughput_per_product
  - constraint_utilization
  - product_prioritization
  - profitability_analysis
  - investment_roi
```

## TOC Financial Measures

### Throughput (T)
```
T = Sales Revenue - Totally Variable Costs

Where Totally Variable Costs = Raw materials, piece-rate labor, sales commissions
```

### Inventory (I)
```
I = All money invested in things intended for sale

Note: Does not include value-added labor or overhead
```

### Operating Expense (OE)
```
OE = All money spent turning Inventory into Throughput

Includes: Labor, utilities, depreciation, overhead
```

## Key Metrics

| Metric | Formula | Purpose |
|--------|---------|---------|
| Net Profit | NP = T - OE | Overall profitability |
| Return on Investment | ROI = NP / I | Investment efficiency |
| Productivity | P = T / OE | Operational efficiency |
| Inventory Turns | Turns = T / I | Cash flow velocity |

## Decision Rules

### Product Mix Optimization
```
Throughput per Constraint Unit = (Price - TVC) / Constraint Time

Prioritize products with highest T/CU
```

### Make vs. Buy Decision
```
If Buy Price < (TVC + Constraint Usage Value)
  Then BUY
Else
  MAKE
```

### Investment Justification
```
Payback Period = Investment Cost / (Delta T - Delta OE)

Accept if Payback Period < Target
```

## Integration Points

- ERP financial modules
- Cost accounting systems
- Product profitability systems
- Capital planning tools
