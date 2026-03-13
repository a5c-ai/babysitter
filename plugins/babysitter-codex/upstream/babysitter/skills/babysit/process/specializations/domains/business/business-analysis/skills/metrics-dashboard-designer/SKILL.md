---
name: metrics-dashboard-designer
description: Design KPI dashboards and tracking mechanisms for performance measurement and reporting
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-017
  category: Performance Measurement
---

# Metrics Dashboard Designer

## Overview

The Metrics Dashboard Designer skill provides specialized capabilities for designing comprehensive KPI dashboards and tracking mechanisms. This skill enables definition of meaningful metrics, creation of effective visualizations, and establishment of data collection and reporting processes for performance management.

## Capabilities

### KPI Definition with Specifications
- Define KPIs with complete measurement specifications
- Create metric definitions with formulas
- Establish data sources and owners
- Set baseline and target values

### Dashboard Layout Design
- Create dashboard layouts and visualizations
- Apply dashboard design best practices
- Balance information density and clarity
- Design executive and operational views

### Metric Calculation Formulas
- Generate metric calculation formulas
- Define aggregation methods
- Handle data quality issues
- Create derived metrics

### Data Collection Mechanisms
- Design data collection mechanisms
- Specify collection frequency
- Define data validation rules
- Establish data flow processes

### Reporting Templates
- Create reporting templates
- Design periodic report formats
- Build exception reports
- Generate management summaries

### Targets and Thresholds
- Define targets and thresholds
- Set RAG (Red/Amber/Green) status rules
- Create escalation triggers
- Establish performance bands

### Metric Trend Analysis
- Generate metric trend analysis
- Calculate period-over-period changes
- Identify patterns and anomalies
- Forecast future performance

## Usage

### Define KPIs
```
Define KPIs for measuring:
[Business objective or initiative]

Include specifications, formulas, targets, and data sources.
```

### Design Dashboard
```
Design a dashboard for:
Audience: [Who will use it]
Purpose: [What decisions it supports]
KPIs: [List of metrics to display]

Create layout with visualization recommendations.
```

### Create Reporting Process
```
Create a reporting process for these metrics:
[Metric list]

Define collection, calculation, and distribution.
```

### Set Targets and Thresholds
```
Establish targets and thresholds for:
[KPI list]

Include RAG status rules and escalation triggers.
```

## Process Integration

This skill integrates with the following business analysis processes:
- solution-performance-assessment.js - Solution metrics tracking
- change-adoption-tracking.js - Change metrics monitoring
- business-case-development.js - Success metrics definition
- consulting-engagement-planning.js - Engagement metrics

## Dependencies

- Dashboard templates
- Visualization best practices
- KPI definition frameworks
- Reporting tools knowledge

## Metrics Dashboard Reference

### KPI Specification Template
```
KPI Name: [Metric name]
ID: KPI-XXX
Owner: [Accountable person]

DEFINITION:
Description: [What this metric measures]
Formula: [Calculation method]
Unit: [Unit of measure]

DATA SOURCE:
Source system: [Where data comes from]
Collection frequency: [How often]
Data owner: [Who provides data]

PERFORMANCE:
Baseline: [Starting value]
Target: [Goal value]
Threshold - Red: [Below X]
Threshold - Amber: [Between X and Y]
Threshold - Green: [Above Y]

REPORTING:
Report frequency: [How often reported]
Report audience: [Who receives]
Visualization: [Chart type]
```

### Dashboard Design Principles
| Principle | Description |
|-----------|-------------|
| Focus | One dashboard, one purpose |
| Hierarchy | Most important metrics prominent |
| Context | Include comparisons and targets |
| Actionable | Enable decision-making |
| Real-time | Refresh frequency matches need |
| Clean | Minimize clutter and decoration |

### Visualization Selection Guide
| Data Type | Best Visualizations |
|-----------|---------------------|
| Single value | Big number, gauge |
| Comparison | Bar chart, bullet chart |
| Trend over time | Line chart, sparkline |
| Part of whole | Pie chart, stacked bar |
| Distribution | Histogram, box plot |
| Relationship | Scatter plot |
| Geographic | Map |

### RAG Status Framework
| Status | Color | Meaning | Action |
|--------|-------|---------|--------|
| On Track | Green | Meeting/exceeding target | Continue current approach |
| At Risk | Amber | Below target but recoverable | Investigate and adjust |
| Off Track | Red | Significantly below target | Escalate and intervene |

### Common KPI Categories
| Category | Example KPIs |
|----------|-------------|
| Financial | Revenue, Cost, Margin, ROI |
| Customer | Satisfaction, NPS, Retention |
| Process | Cycle time, Error rate, Throughput |
| Quality | Defect rate, First-pass yield |
| Employee | Engagement, Turnover, Training |
| Project | On-time, On-budget, Scope changes |

### Data Collection Checklist
- [ ] Data source identified
- [ ] Collection frequency defined
- [ ] Data owner assigned
- [ ] Validation rules specified
- [ ] Historical data available
- [ ] Refresh process documented
- [ ] Data quality acceptable

### Reporting Frequency Guidelines
| Metric Type | Typical Frequency |
|-------------|-------------------|
| Operational | Daily/Real-time |
| Tactical | Weekly/Bi-weekly |
| Strategic | Monthly/Quarterly |
| Program/Project | As per milestones |

### Dashboard Layout Template
```
┌─────────────────────────────────────────────┐
│              DASHBOARD TITLE                │
│         [Filters] [Date Range]              │
├──────────────┬──────────────┬──────────────┤
│   KPI 1      │   KPI 2      │   KPI 3      │
│   (Big #)    │   (Big #)    │   (Big #)    │
├──────────────┴──────────────┴──────────────┤
│            Trend Chart                      │
│        (Line/Area Chart)                    │
├─────────────────────┬──────────────────────┤
│   Comparison Chart  │  Status Table        │
│   (Bar Chart)       │  (Table with RAG)    │
├─────────────────────┴──────────────────────┤
│           Detail Table / List               │
└─────────────────────────────────────────────┘
```
