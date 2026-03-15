---
name: sop-facilitator
description: Sales and Operations Planning process facilitation skill with demand-supply balancing and cross-functional alignment
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: capacity-planning
---

# S&OP Facilitator

## Overview

The S&OP Facilitator skill provides comprehensive capabilities for facilitating the Sales and Operations Planning process. It supports demand-supply balancing, cross-functional alignment, scenario planning, and executive decision support.

## Capabilities

- Demand plan aggregation
- Supply plan development
- Gap reconciliation
- Executive S&OP meeting facilitation
- Scenario planning
- Financial impact analysis
- Consensus forecasting
- Performance tracking

## Used By Processes

- CAP-003: Sales and Operations Planning
- CAP-001: Capacity Requirements Planning
- CAP-004: Demand Forecasting and Analysis

## Tools and Libraries

- S&OP platforms (Kinaxis, o9)
- Collaboration tools
- BI dashboards
- Scenario modeling tools

## Usage

```yaml
skill: sop-facilitator
inputs:
  planning_cycle: "monthly"
  planning_horizon: 18  # months
  demand_input:
    - source: "sales_forecast"
      volume: 50000
      revenue: 5000000
    - source: "marketing_pipeline"
      volume: 10000
      revenue: 1200000
  supply_input:
    - resource: "Plant A"
      capacity: 45000
    - resource: "Plant B"
      capacity: 30000
  constraints:
    - type: "labor"
      limit: "10% overtime max"
    - type: "material"
      limit: "Supplier X at capacity"
outputs:
  - demand_plan
  - supply_plan
  - gap_analysis
  - scenarios
  - executive_summary
  - action_items
```

## S&OP Process Steps

### Step 1: Data Gathering
- Collect demand forecasts
- Update supply capabilities
- Gather inventory positions
- Review financial targets

### Step 2: Demand Review
- Review statistical forecast
- Incorporate sales input
- Adjust for marketing events
- Finalize demand plan

### Step 3: Supply Review
- Assess capacity availability
- Identify constraints
- Develop supply options
- Create supply plan

### Step 4: Pre-S&OP Meeting
- Reconcile demand and supply
- Develop scenarios
- Analyze financial impact
- Prepare recommendations

### Step 5: Executive S&OP
- Present gaps and options
- Make decisions
- Assign accountability
- Communicate plan

## Key Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Forecast Accuracy | MAPE of demand forecast | < 20% |
| Plan Attainment | Actual vs. plan | > 95% |
| Inventory Health | Weeks of supply | Target +/- 10% |
| On-Time Delivery | Customer OTIF | > 98% |

## Scenario Analysis Framework

| Scenario | Description | Likelihood | Impact |
|----------|-------------|------------|--------|
| Base | Most likely outcome | High | Medium |
| Upside | Best case | Low | Positive |
| Downside | Worst case | Low | Negative |
| Stretch | Aspirational | Medium | Positive |

## Integration Points

- ERP systems
- CRM systems
- Financial planning
- Demand planning systems
