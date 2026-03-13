---
name: bi-reporting
description: Business intelligence and dashboard creation for marketing analytics and reporting
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: digital-marketing
  domain: business
  category: Analytics and Measurement
  skill-id: SK-017
  dependencies:
    - BI platform APIs
    - Supermetrics API
---

# BI and Reporting Skill

## Overview

The BI and Reporting skill provides comprehensive capabilities for business intelligence dashboard development, data visualization, and automated marketing reporting across major BI platforms. This skill enables creation of insightful marketing performance dashboards, custom metric calculations, and automated report distribution.

## Capabilities

### Looker Dashboard Development
- LookML model creation
- Explore configuration
- Dashboard tile design
- Filter and parameter setup
- Scheduled delivery configuration
- Embedding and API access
- User permission management
- Data freshness monitoring

### Tableau Visualization Creation
- Workbook and dashboard design
- Calculated field creation
- Parameter and filter configuration
- Data source connections
- Dashboard actions setup
- Tableau Server publishing
- Subscription configuration
- Mobile optimization

### Power BI Report Building
- Report page design
- DAX measure creation
- Data model relationships
- Slicers and filters
- Power BI Service publishing
- Workspace management
- Row-level security
- Dataflow configuration

### Google Data Studio (Looker Studio)
- Report template creation
- Data source configuration
- Calculated fields
- Date range controls
- Filter controls
- Chart customization
- Report sharing
- Scheduled email delivery

### Supermetrics Data Connector
- Multi-platform data extraction
- Query configuration
- Scheduled data refresh
- Data destination setup
- Custom field mapping
- API quota management
- Error handling
- Historical data backfill

### Custom Metric Calculations
- Blended metrics across sources
- Cohort-based calculations
- Attribution-weighted metrics
- YoY and MoM comparisons
- Rolling averages
- Benchmark calculations
- Goal tracking metrics
- Forecast vs actual

### Automated Report Scheduling
- Daily/weekly/monthly reports
- Conditional alerting
- Stakeholder distribution lists
- Format customization (PDF, CSV, Excel)
- Timezone handling
- Holiday scheduling
- Failure notifications
- Report versioning

### Data Blending and Joins
- Cross-source data blending
- Key field matching
- Left/right/inner joins
- Union operations
- Data type harmonization
- Null handling
- Duplicate management
- Performance optimization

### Alert Configuration
- Threshold-based alerts
- Anomaly detection alerts
- Trend deviation alerts
- Budget pacing alerts
- Goal completion alerts
- Multi-channel delivery
- Escalation rules
- Alert history tracking

## Usage

### Dashboard Configuration
```javascript
const dashboardConfig = {
  name: 'Marketing Performance Dashboard',
  platform: 'looker-studio',
  dataSources: [
    {
      name: 'Google Analytics 4',
      connector: 'ga4',
      refreshSchedule: 'daily'
    },
    {
      name: 'Google Ads',
      connector: 'google-ads',
      refreshSchedule: 'daily'
    },
    {
      name: 'Meta Ads',
      connector: 'meta-ads',
      refreshSchedule: 'daily'
    },
    {
      name: 'CRM Data',
      connector: 'salesforce',
      refreshSchedule: 'daily'
    }
  ],
  pages: [
    {
      name: 'Executive Summary',
      charts: ['kpi-scorecard', 'trend-chart', 'channel-breakdown']
    },
    {
      name: 'Paid Media',
      charts: ['spend-by-channel', 'roas-trend', 'campaign-table']
    },
    {
      name: 'Organic',
      charts: ['organic-traffic', 'seo-rankings', 'content-performance']
    },
    {
      name: 'Conversion',
      charts: ['funnel-visualization', 'conversion-rate', 'revenue-attribution']
    }
  ],
  filters: [
    {
      name: 'Date Range',
      type: 'date-range',
      default: 'last-30-days'
    },
    {
      name: 'Channel',
      type: 'dropdown',
      allowMultiple: true
    },
    {
      name: 'Campaign',
      type: 'search'
    }
  ]
};
```

### Custom Metric Definitions
```javascript
const customMetrics = {
  blendedROAS: {
    formula: '(ga4_revenue + offline_revenue) / total_ad_spend',
    dataSources: ['ga4', 'crm', 'google-ads', 'meta-ads'],
    description: 'Blended ROAS including offline conversions'
  },
  customerAcquisitionCost: {
    formula: 'total_marketing_spend / new_customers',
    dataSources: ['all-paid-media', 'crm'],
    description: 'Cost to acquire one new customer'
  },
  marketingEfficiencyRatio: {
    formula: 'total_revenue / total_marketing_spend',
    dataSources: ['crm', 'all-paid-media'],
    description: 'Revenue generated per marketing dollar spent'
  },
  leadToCustomerRate: {
    formula: 'new_customers / marketing_qualified_leads',
    dataSources: ['crm'],
    description: 'Percentage of MQLs that become customers'
  },
  pipelineVelocity: {
    formula: '(opportunities * avg_deal_size * win_rate) / avg_sales_cycle',
    dataSources: ['crm'],
    description: 'Expected revenue flow through pipeline'
  }
};
```

### Automated Report Configuration
```javascript
const reportSchedule = {
  name: 'Weekly Marketing Report',
  frequency: 'weekly',
  dayOfWeek: 'monday',
  time: '08:00',
  timezone: 'America/New_York',
  recipients: [
    {
      email: 'marketing-team@company.com',
      format: 'pdf'
    },
    {
      email: 'executives@company.com',
      format: 'pdf',
      summaryOnly: true
    },
    {
      email: 'analytics-team@company.com',
      format: 'csv',
      includeRawData: true
    }
  ],
  conditionalSend: {
    enabled: true,
    condition: 'data-updated'
  },
  alerts: {
    onFailure: ['admin@company.com'],
    onDataIssue: ['data-team@company.com']
  }
};
```

### Alert Configuration
```javascript
const alertConfig = {
  alerts: [
    {
      name: 'Budget Pacing Alert',
      metric: 'daily_spend',
      condition: 'exceeds',
      threshold: 'daily_budget * 1.1',
      frequency: 'realtime',
      channels: ['email', 'slack']
    },
    {
      name: 'ROAS Drop Alert',
      metric: 'roas_7day',
      condition: 'drops_below',
      threshold: 2.0,
      comparedTo: 'previous_period',
      frequency: 'daily',
      channels: ['email']
    },
    {
      name: 'Conversion Anomaly',
      metric: 'conversions',
      condition: 'anomaly_detected',
      sensitivity: 'high',
      frequency: 'hourly',
      channels: ['slack']
    },
    {
      name: 'Monthly Goal Tracking',
      metric: 'monthly_revenue',
      condition: 'pacing_below',
      threshold: 0.9,
      frequency: 'daily',
      channels: ['email']
    }
  ]
};
```

## Process Integration

This skill integrates with the following digital marketing processes:

| Process | Integration Points |
|---------|-------------------|
| marketing-performance-dashboard.js | Dashboard creation, metric definitions, automated reporting |
| attribution-measurement.js | Attribution visualization, ROI reporting |
| competitive-intelligence.js | Competitive benchmarking dashboards |

## Best Practices

1. **Data Freshness**: Clearly display data refresh timestamps on all dashboards
2. **Metric Definitions**: Document all custom metric calculations and data sources
3. **Performance**: Optimize queries and use aggregated data for large datasets
4. **Mobile First**: Design dashboards to be readable on mobile devices
5. **Consistent Naming**: Use standardized naming conventions across all reports
6. **Access Control**: Implement appropriate permissions for sensitive data
7. **Version Control**: Maintain version history for dashboard changes
8. **Testing**: Validate data accuracy before distributing reports
9. **User Training**: Provide documentation and training for dashboard users
10. **Feedback Loop**: Regularly gather user feedback to improve dashboards

## Dashboard Design Principles

### Executive Dashboards
- Focus on KPIs and high-level trends
- Use scorecards and summary visualizations
- Include goal progress and benchmarks
- Keep interactions minimal
- Enable drill-down for interested users

### Operational Dashboards
- Include detailed performance data
- Enable filtering and segmentation
- Provide export capabilities
- Show real-time or near-real-time data
- Include actionable insights

### Analyst Dashboards
- Allow complex filtering and segmentation
- Include raw data access
- Enable custom date ranges
- Support ad-hoc analysis
- Provide data download options

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Report Accuracy | Data matches source systems | 100% |
| Dashboard Load Time | Time to render dashboard | <5 seconds |
| Data Freshness | Time since last update | <24 hours |
| User Adoption | Active dashboard users | >80% of stakeholders |
| Alert Accuracy | True positive rate for alerts | >95% |
| Report Delivery | Successful scheduled deliveries | >99% |

## Related Skills

- SK-003: Google Analytics 4 (GA4 data integration)
- SK-016: CRM Integration (CRM data for reporting)
- SK-001: Google Ads Management (paid media data)
- SK-002: Meta Ads Management (social data)
