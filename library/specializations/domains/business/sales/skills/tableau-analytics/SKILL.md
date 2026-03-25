---
name: tableau-analytics
description: Tableau dashboard and visualization integration for sales analytics
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: sales
  domain: business
  priority: P2
  integration-points:
    - Tableau REST API
    - Tableau Embedding API
---

# Tableau Analytics

## Overview

The Tableau Analytics skill provides integration with Tableau for dashboard data extraction, workbook query execution, embedded analytics, and custom visualization generation. This skill enables rich visual analytics for sales performance, pipeline health, and territory analysis.

## Capabilities

### Dashboard Data Extraction
- Extract data from published dashboards
- Access underlying data sources
- Retrieve filtered and aggregated views
- Export data for further analysis

### Workbook Query Execution
- Execute queries against Tableau workbooks
- Filter data dynamically
- Aggregate across multiple views
- Apply parameter-driven analysis

### Embedded Analytics
- Generate embed codes for dashboards
- Configure secure viewer access
- Enable interactive filtering
- Support mobile-responsive views

### Custom Visualization
- Generate visualizations programmatically
- Create ad-hoc reports
- Build dynamic dashboards
- Export in multiple formats

## Usage

### Executive Dashboard Generation
```
Extract key metrics from sales dashboards for executive reporting and trend analysis.
```

### Territory Performance Analysis
```
Query territory performance workbooks to identify underperforming regions requiring attention.
```

### Custom Report Creation
```
Generate a custom visualization combining pipeline data with activity metrics for QBR preparation.
```

## Enhances Processes

- qbr-process
- pipeline-review-forecast
- territory-design-assignment

## Dependencies

- Tableau Server or Tableau Online subscription
- Published workbooks and dashboards
- Appropriate user permissions
