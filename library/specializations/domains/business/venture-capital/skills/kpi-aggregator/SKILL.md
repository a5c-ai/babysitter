---
name: kpi-aggregator
description: Aggregates KPIs from portfolio companies, normalizes metrics
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-033
---

# KPI Aggregator

## Overview

The KPI Aggregator skill collects and normalizes key performance indicators from portfolio companies for consolidated reporting. It enables standardized portfolio analysis despite varying reporting formats and metrics definitions across companies.

## Capabilities

### Data Collection
- Collect KPIs from multiple sources
- Support various input formats (spreadsheets, APIs, emails)
- Handle periodic collection schedules
- Track submission compliance

### Metric Normalization
- Standardize metric definitions
- Normalize time periods and currencies
- Handle different accounting treatments
- Reconcile varying calculation methods

### Portfolio Aggregation
- Aggregate across portfolio companies
- Calculate portfolio-level metrics
- Track sector and stage segments
- Compare to benchmarks

### Trend Analysis
- Track metrics over time
- Calculate growth rates and trends
- Identify anomalies and concerns
- Generate trend visualizations

## Usage

### Collect Portfolio KPIs
```
Input: Collection period, company list
Process: Gather data from sources
Output: Raw KPI data, submission status
```

### Normalize Metrics
```
Input: Raw KPI data, normalization rules
Process: Standardize definitions and formats
Output: Normalized metric dataset
```

### Aggregate Portfolio View
```
Input: Normalized data, aggregation parameters
Process: Calculate portfolio metrics
Output: Portfolio summary, segment analysis
```

### Analyze Trends
```
Input: Historical KPI data
Process: Calculate trends, identify patterns
Output: Trend analysis, anomaly flags
```

## Core KPI Categories

| Category | Key Metrics |
|----------|-------------|
| Revenue | ARR, MRR, revenue growth, NRR |
| Unit Economics | LTV, CAC, LTV/CAC, payback |
| Growth | Logo growth, expansion rate |
| Engagement | DAU/MAU, retention, NPS |
| Financial | Burn rate, runway, gross margin |

## Integration Points

- **Quarterly Portfolio Reporting**: Core data collection
- **Portfolio Dashboard Builder**: Feed dashboard data
- **Cohort Analyzer**: Connect to cohort analysis
- **Portfolio Reporter (Agent)**: Support reporting

## Data Sources

- Portfolio company reporting systems
- Email-based report collection
- Carta and cap table systems
- Accounting system integrations
- Manual data entry portals

## Best Practices

1. Establish clear metric definitions
2. Enforce consistent reporting periods
3. Validate data before aggregation
4. Track reporting compliance
5. Document normalization adjustments
