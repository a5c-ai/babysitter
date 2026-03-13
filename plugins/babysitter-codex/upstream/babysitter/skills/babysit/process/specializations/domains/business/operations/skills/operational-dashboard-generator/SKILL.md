---
name: operational-dashboard-generator
description: Real-time operational performance dashboard skill with KPI visualization and alerting
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: operational-analytics
---

# Operational Dashboard Generator

## Overview

The Operational Dashboard Generator skill provides comprehensive capabilities for creating real-time operational performance dashboards. It supports KPI definition, visual management displays, trend analysis, and alert configuration.

## Capabilities

- KPI definition and calculation
- Real-time data integration
- Visual management displays
- Trend analysis
- Alert threshold configuration
- Drill-down reporting
- Mobile dashboard access
- Executive summary generation

## Used By Processes

- CI-001: Operational Excellence Program Design
- SIX-002: Statistical Process Control Implementation
- QMS-003: Quality Audit Management

## Tools and Libraries

- Power BI
- Tableau
- Grafana
- Real-time data platforms

## Usage

```yaml
skill: operational-dashboard-generator
inputs:
  dashboard_type: "operations_center"  # executive | operations_center | shop_floor
  kpis:
    - name: "OEE"
      target: 85
      warning_threshold: 75
      critical_threshold: 65
      calculation: "(availability * performance * quality)"
    - name: "On-Time Delivery"
      target: 98
      warning_threshold: 95
      critical_threshold: 90
      calculation: "(on_time_orders / total_orders) * 100"
  data_sources:
    - type: "mes"
      connection: "mes_api"
    - type: "erp"
      connection: "sap_bapi"
  refresh_rate: 60  # seconds
outputs:
  - dashboard_definition
  - visualization_specs
  - alert_configuration
  - data_model
  - mobile_view
```

## KPI Categories

### Production KPIs
| KPI | Definition | Target |
|-----|------------|--------|
| OEE | Equipment effectiveness | >85% |
| Throughput | Units per hour | Per plan |
| Yield | Good units / Total units | >99% |
| Cycle Time | Time per unit | At takt |

### Quality KPIs
| KPI | Definition | Target |
|-----|------------|--------|
| First Pass Yield | Pass first time | >98% |
| Defect Rate | Defects per million | <1000 |
| Scrap Rate | Scrap cost % | <1% |
| Customer Complaints | Per period | Trending down |

### Delivery KPIs
| KPI | Definition | Target |
|-----|------------|--------|
| On-Time Delivery | % shipped on time | >98% |
| Lead Time | Order to ship | Per commitment |
| Schedule Attainment | Actual vs. plan | >95% |
| Backlog | Past due orders | Zero |

## Dashboard Design Principles

### Information Hierarchy
1. Key metrics (big numbers)
2. Trends (charts)
3. Details (tables)
4. Drill-down (links)

### Visual Best Practices
- Use color meaningfully (RAG status)
- Minimize clutter
- Consistent layout
- Clear labels
- Real-time updates

## Alert Configuration

| Level | Threshold | Action |
|-------|-----------|--------|
| Info | Near target | Monitor |
| Warning | Below target | Investigate |
| Critical | Significantly below | Immediate action |

## Dashboard Layers

### Executive Dashboard
- High-level summary
- Company-wide view
- Weekly/monthly trends
- Strategic KPIs

### Operations Center
- Site-level view
- Daily/hourly trends
- Operational KPIs
- Resource status

### Shop Floor Display
- Real-time status
- Line-level view
- Visual management
- Immediate feedback

## Integration Points

- Manufacturing Execution Systems
- ERP systems
- Quality Management Systems
- IoT/sensor data
