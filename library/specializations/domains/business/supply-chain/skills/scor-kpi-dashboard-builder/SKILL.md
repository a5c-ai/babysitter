---
name: scor-kpi-dashboard-builder
description: SCOR-aligned supply chain KPI dashboard design and implementation skill
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: analytics
  priority: high
---

# SCOR KPI Dashboard Builder

## Overview

The SCOR KPI Dashboard Builder enables the design and implementation of supply chain performance dashboards aligned with the Supply Chain Operations Reference (SCOR) model. It supports metric selection, data mapping, visualization design, and executive reporting.

## Capabilities

- **SCOR Metric Taxonomy Mapping**: Align KPIs to SCOR framework
- **Plan/Source/Make/Deliver/Return KPI Selection**: Process-aligned metrics
- **Data Source Identification and Mapping**: Connect metrics to data sources
- **Dashboard Layout Design**: Effective visualization structure
- **Drill-Down Hierarchy Creation**: Multi-level metric exploration
- **Target and Threshold Setting**: Performance benchmarks
- **Benchmarking Integration**: Industry comparison capability
- **Executive Summary Generation**: Leadership-ready reports

## Input Schema

```yaml
dashboard_request:
  scope:
    processes: array              # Plan, Source, Make, Deliver, Return
    business_units: array
    time_periods: array
  metric_selection:
    strategic_metrics: array
    operational_metrics: array
    custom_metrics: array
  data_sources:
    erp_systems: array
    planning_systems: array
    external_sources: array
  design_requirements:
    audience: string
    refresh_frequency: string
    drill_down_levels: integer
  targets:
    internal_targets: object
    benchmark_sources: array
```

## Output Schema

```yaml
dashboard_output:
  dashboard_design:
    layout: object
    pages: array
      - page_name: string
        visualizations: array
        filters: array
    navigation: object
  metric_catalog:
    metrics: array
      - metric_id: string
        name: string
        scor_mapping: string
        definition: string
        formula: string
        unit: string
        target: float
        data_source: string
        refresh_frequency: string
  data_model:
    tables: array
    relationships: array
    calculations: array
  implementation_guide:
    data_requirements: array
    etl_specifications: object
    deployment_steps: array
  executive_summary_template: object
```

## Usage

### SCOR-Aligned Dashboard Design

```
Input: SCOR process scope, business requirements
Process: Select metrics, design layout, map data
Output: Dashboard design specification
```

### Metric Catalog Development

```
Input: Business objectives, SCOR framework
Process: Define metrics with formulas and targets
Output: Comprehensive metric catalog
```

### Executive Summary Automation

```
Input: Dashboard data, reporting period
Process: Generate narrative summary with highlights
Output: Executive-ready performance summary
```

## Integration Points

- **BI Platforms**: Power BI, Tableau, Qlik integration
- **ERP Systems**: SAP, Oracle data connectivity
- **SCOR Framework**: APICS SCOR model alignment
- **Tools/Libraries**: Power BI, Tableau, SCOR templates

## Process Dependencies

- Supply Chain KPI Dashboard Development
- Supply Chain Cost-to-Serve Analysis
- Forecast Accuracy Analysis and Improvement

## Best Practices

1. Start with strategic metrics, then add operational detail
2. Ensure data quality before dashboard deployment
3. Design for the audience (executive vs. operational)
4. Include context (targets, trends, benchmarks)
5. Enable self-service exploration
6. Review and refresh metrics annually
