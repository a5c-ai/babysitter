---
name: budget-forecasting-engine
description: Driver-based budgeting and forecasting skill with rolling forecast support and variance analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: financial-modeling
  priority: high
---

# Budget Forecasting Engine

## Overview

The Budget Forecasting Engine skill provides comprehensive budgeting and forecasting capabilities using driver-based models. It supports both annual budget development and rolling forecast management with integrated variance analysis.

## Capabilities

### Driver-Based Model Construction
- Revenue driver identification and modeling
- Cost driver analysis and allocation
- Headcount-based expense planning
- Volume-based cost modeling
- Activity-based costing integration
- KPI linkage to financial outcomes

### Top-Down and Bottom-Up Consolidation
- Department-level input collection
- Multi-level rollup logic
- Intercompany elimination handling
- Currency consolidation
- Allocation methodology support
- Segment reporting alignment

### Rolling Forecast Extension
- Automatic period extension
- Historical accuracy tracking
- Trend-based projections
- Seasonal pattern recognition
- Reforecast integration
- Forecast lock procedures

### What-If Scenario Modeling
- Assumption override capability
- Scenario comparison tools
- Impact quantification
- Probability weighting
- Decision tree support
- Sensitivity tables

### Seasonality Adjustment
- Historical pattern analysis
- Seasonal index calculation
- De-seasonalization tools
- Working day adjustments
- Holiday impact factors
- Weather-related adjustments

### Automatic Variance Calculation
- Budget vs. actual comparison
- Prior period comparison
- Prior year comparison
- Volume/price/mix analysis
- Root cause categorization
- Materiality thresholds

## Usage

### Annual Budget Development
```
Input: Strategic targets, department requests, historical patterns
Process: Build driver-based budget with consolidation and review cycles
Output: Approved annual budget with monthly/quarterly breakdown
```

### Rolling Forecast Update
```
Input: Latest actuals, revised assumptions, current forecast
Process: Extend forecast window, adjust for known changes
Output: Updated rolling forecast with variance to budget
```

## Integration

### Used By Processes
- Annual Budget Development
- Rolling Forecast Management
- Variance Analysis and Reporting

### Tools and Libraries
- Anaplan connectors
- Adaptive Insights API
- Excel automation
- pandas for data manipulation

## Best Practices

1. Maintain clear linkage between drivers and financial outcomes
2. Document all assumptions with owners and review dates
3. Establish variance thresholds for escalation
4. Build in version control for forecast iterations
5. Enable department-level input without breaking consolidation
6. Create audit trails for all changes
