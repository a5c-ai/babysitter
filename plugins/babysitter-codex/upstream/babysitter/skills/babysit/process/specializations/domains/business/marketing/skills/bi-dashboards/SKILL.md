---
name: bi-dashboards
description: Business intelligence and marketing dashboard creation with multi-platform support
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: marketing
  domain: business
  category: Marketing Analytics
  skill-id: SK-014
---

# BI and Dashboard Platform Skill

## Overview

The BI and Dashboard Platform Skill provides comprehensive integration with business intelligence and marketing dashboard tools. This skill enables automated dashboard development, report building, data connector configuration, and visualization optimization across major BI platforms including Tableau, Power BI, Looker Studio, and Domo.

## Capabilities

### Tableau Dashboard Development
- Workbook creation and configuration
- Data source connections and extracts
- Calculated field development
- Dashboard layout and design
- Filter and parameter configuration
- Action and interactivity setup
- Performance optimization
- Publishing and permissions management

### Power BI Report Building
- Report and dashboard creation
- DAX measure development
- Power Query transformations
- Custom visual integration
- Row-level security configuration
- Dataflow development
- Workspace management
- Scheduled refresh setup

### Looker Studio (Google Data Studio)
- Report template creation
- Data connector configuration
- Blended data source setup
- Calculated field development
- Chart and visualization design
- Filter control configuration
- Report sharing and embedding
- Community visualization integration

### Domo Dashboard Creation
- Card and dashboard development
- Magic ETL pipeline building
- Beast Mode calculations
- Drill path configuration
- Alert and notification setup
- App integration
- User and group permissions
- Scheduled reports

### Supermetrics Data Connector
- Marketing data pipeline configuration
- Multi-source data aggregation
- Custom metric calculations
- Scheduled data refresh
- Data destination routing
- Query template management
- Historical data backfill
- API usage optimization

### Cross-Platform Features
- Custom metric calculations and KPI definitions
- Automated report scheduling and distribution
- Data blending and joins across sources
- Alert and notification setup for threshold monitoring
- Template development for consistency
- Documentation and governance standards

## Process Integration

This skill integrates with the following marketing processes:

- **marketing-dashboard-development.js** - Primary dashboard creation and maintenance
- **marketing-roi-analysis.js** - ROI visualization and reporting
- **campaign-performance-analysis.js** - Campaign analytics dashboards

## Dependencies

- Tableau API / Tableau Server REST API
- Power BI REST API
- Looker API
- Domo API
- Supermetrics API
- Google Analytics API (for data sources)
- Marketing platform APIs (for data connectors)

## Usage

### Basic Dashboard Creation

```yaml
skill: bi-dashboards
action: create-dashboard
parameters:
  platform: tableau | powerbi | looker-studio | domo
  dashboard_name: "Marketing Performance Dashboard"
  data_sources:
    - type: google-analytics
      connection: ga4-production
    - type: crm
      connection: salesforce-marketing
  visualizations:
    - type: kpi-cards
      metrics: [revenue, conversions, cpa]
    - type: trend-chart
      dimension: date
      metrics: [sessions, conversions]
    - type: breakdown-table
      dimensions: [channel, campaign]
      metrics: [spend, revenue, roas]
```

### Automated Report Scheduling

```yaml
skill: bi-dashboards
action: schedule-report
parameters:
  platform: powerbi
  report_id: "marketing-weekly-report"
  schedule:
    frequency: weekly
    day: monday
    time: "08:00"
  distribution:
    format: pdf
    recipients:
      - marketing-team@company.com
      - leadership@company.com
```

### Custom Metric Development

```yaml
skill: bi-dashboards
action: create-metric
parameters:
  platform: tableau
  metric_name: "Blended ROAS"
  calculation: |
    SUM([Revenue]) / SUM([Ad Spend])
  format: percentage
  aggregation: ratio
```

### Data Blending Configuration

```yaml
skill: bi-dashboards
action: blend-data
parameters:
  platform: looker-studio
  primary_source: google-analytics
  secondary_source: google-ads
  join_keys:
    - primary: campaign_name
      secondary: campaign
  metrics_to_add:
    - cost
    - clicks
    - impressions
```

## Best Practices

1. **Data Governance**: Maintain consistent naming conventions and metric definitions across dashboards
2. **Performance**: Optimize data extracts and queries for dashboard load time
3. **Documentation**: Include data source documentation and metric calculation logic
4. **Access Control**: Implement appropriate row-level security and permissions
5. **Version Control**: Track dashboard versions and maintain change history
6. **Mobile Optimization**: Design dashboards for cross-device accessibility
7. **Alerting**: Configure meaningful alerts for business-critical metrics

## Related Skills

- SK-005: Marketing Analytics Platform
- SK-018: CRM Integration
- SK-015: Customer Data Platform

## Related Agents

- AG-008: Marketing Analytics Director
- AG-011: Marketing Operations Manager
