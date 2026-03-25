---
name: kpi-tracker
description: KPI definition, calculation, and tracking skill for business intelligence dashboards
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: visualization
  priority: high
  shared-candidate: true
  tools-libraries:
    - pandas
    - polars
    - great_expectations
    - pandera
---

# KPI Tracker

## Overview

The KPI Tracker skill provides comprehensive capabilities for defining, calculating, and monitoring Key Performance Indicators. It supports the full KPI lifecycle from definition through tracking, alerting, and reporting for business intelligence and performance management.

## Capabilities

- KPI formula definition and validation
- Target and threshold management
- Traffic light status calculation
- Trend analysis and forecasting
- Drill-down hierarchy configuration
- Benchmark comparison
- Variance analysis
- Automated alert generation

## Used By Processes

- KPI Framework Development
- Executive Dashboard Development
- Operational Reporting System Design

## Usage

### KPI Definition

```python
# Define KPI structure
kpi_definition = {
    "name": "Customer Acquisition Cost",
    "code": "CAC",
    "category": "Marketing",
    "description": "Total cost to acquire a new customer",
    "formula": "total_marketing_spend / new_customers_acquired",
    "unit": "currency",
    "polarity": "lower_is_better",
    "frequency": "monthly",
    "owner": "Marketing Director",
    "data_sources": [
        {"name": "marketing_spend", "source": "finance_system", "table": "expenses"},
        {"name": "new_customers", "source": "crm", "table": "customers"}
    ]
}
```

### Target Configuration

```python
# Define targets and thresholds
targets = {
    "kpi": "CAC",
    "period": "2024-Q1",
    "target": 150,
    "thresholds": {
        "green": {"max": 150},
        "yellow": {"min": 150, "max": 200},
        "red": {"min": 200}
    },
    "benchmark": {
        "industry_average": 180,
        "best_in_class": 100,
        "previous_period": 175
    }
}
```

### Hierarchy Configuration

```python
# Define drill-down hierarchy
hierarchy = {
    "kpi": "Revenue",
    "levels": [
        {"name": "Total", "aggregation": "sum"},
        {"name": "Region", "dimension": "geography", "aggregation": "sum"},
        {"name": "Product Line", "dimension": "product", "aggregation": "sum"},
        {"name": "Sales Rep", "dimension": "salesperson", "aggregation": "sum"}
    ]
}
```

### Alert Configuration

```python
# Configure automated alerts
alert_config = {
    "kpi": "CAC",
    "conditions": [
        {
            "type": "threshold_breach",
            "threshold": "red",
            "consecutive_periods": 2,
            "notification": ["email", "slack"]
        },
        {
            "type": "trend",
            "direction": "increasing",
            "periods": 3,
            "min_change_percent": 10,
            "notification": ["email"]
        },
        {
            "type": "forecast_breach",
            "horizon": 3,
            "probability": 0.8,
            "notification": ["email", "dashboard"]
        }
    ]
}
```

## KPI Categories

| Category | Example KPIs |
|----------|-------------|
| Financial | Revenue, Profit Margin, ROI, CAC, LTV |
| Customer | NPS, Churn Rate, CSAT, Retention |
| Operational | Cycle Time, Defect Rate, Utilization |
| Growth | MRR Growth, User Growth, Market Share |
| Efficiency | Cost per Unit, Revenue per Employee |

## Input Schema

```json
{
  "operation": "define|calculate|track|alert",
  "kpi_definition": {
    "name": "string",
    "formula": "string",
    "unit": "string",
    "polarity": "higher_is_better|lower_is_better",
    "frequency": "string"
  },
  "targets": {
    "value": "number",
    "thresholds": "object"
  },
  "data": {
    "source": "string",
    "period": "string",
    "values": "object"
  },
  "analysis_options": {
    "trend_analysis": "boolean",
    "forecast": "boolean",
    "variance_analysis": "boolean"
  }
}
```

## Output Schema

```json
{
  "kpi_values": {
    "current_value": "number",
    "previous_value": "number",
    "target": "number",
    "variance": "number",
    "variance_percent": "number",
    "status": "green|yellow|red"
  },
  "trend_analysis": {
    "direction": "improving|stable|declining",
    "change_percent": "number",
    "periods_analyzed": "number"
  },
  "forecast": {
    "next_period": "number",
    "confidence_interval": ["number", "number"],
    "will_breach_target": "boolean"
  },
  "drill_down": {
    "dimension_values": "object"
  },
  "alerts": [
    {
      "type": "string",
      "severity": "string",
      "message": "string"
    }
  ]
}
```

## Best Practices

1. Limit KPIs to 5-7 per dashboard (avoid metric overload)
2. Define clear ownership for each KPI
3. Set SMART targets (Specific, Measurable, Achievable, Relevant, Time-bound)
4. Include leading indicators, not just lagging
5. Validate formulas with business stakeholders
6. Document data lineage and calculation logic
7. Review and retire obsolete KPIs regularly

## Data Quality

The skill validates:
- Data completeness (missing values)
- Data freshness (last update time)
- Formula validity (division by zero, null handling)
- Reasonable ranges (outlier detection)

## Integration Points

- Feeds into Decision Visualization for dashboards
- Connects with Data Storytelling for narratives
- Supports Time Series Forecaster for predictions
- Integrates with Alert systems for notifications
