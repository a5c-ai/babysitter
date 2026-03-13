---
name: cohort-analyzer
description: Analyzes revenue cohorts, retention curves, LTV/CAC trends over time
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
  skill-id: vc-skill-011
---

# Cohort Analyzer

## Overview

The Cohort Analyzer skill provides systematic analysis of customer and revenue cohorts to understand retention patterns, lifetime value trends, and business health over time. It enables deep understanding of unit economics evolution and customer quality.

## Capabilities

### Revenue Cohort Analysis
- Track revenue by acquisition cohort
- Analyze net revenue retention (NRR) by cohort
- Measure expansion, contraction, and churn
- Identify cohort quality trends over time

### Retention Curve Analysis
- Build and visualize retention curves
- Compare retention across cohorts
- Calculate retention benchmarks by segment
- Identify retention inflection points

### LTV/CAC Analysis
- Calculate LTV by cohort and segment
- Track CAC trends over time
- Analyze LTV/CAC ratio evolution
- Model payback period by cohort

### Segment Analysis
- Segment cohorts by customer type
- Analyze channel-specific cohort quality
- Compare enterprise vs. SMB retention
- Identify highest-value customer segments

## Usage

### Analyze Revenue Cohorts
```
Input: Revenue data by customer and month
Process: Build cohort matrix, calculate retention
Output: Cohort analysis, NRR by cohort, visualizations
```

### Build Retention Curves
```
Input: Customer data with start dates and activity
Process: Calculate retention by period since acquisition
Output: Retention curves, benchmark comparisons
```

### Calculate Unit Economics
```
Input: Revenue cohorts, CAC data, time horizon
Process: Calculate LTV, LTV/CAC, payback
Output: Unit economics summary, trend analysis
```

### Identify Cohort Trends
```
Input: Multi-period cohort data
Process: Analyze quality trends, flag concerns
Output: Trend analysis, quality assessment
```

## Key Metrics

| Metric | Calculation | Target Range |
|--------|-------------|--------------|
| NRR (Net Revenue Retention) | (Start + Expansion - Churn) / Start | 100-130%+ |
| GRR (Gross Revenue Retention) | (Start - Churn) / Start | 85-95%+ |
| LTV/CAC | Lifetime Value / Customer Acquisition Cost | 3x+ |
| Payback Period | Months to recover CAC | 12-18 months |

## Integration Points

- **Financial Due Diligence**: Support revenue quality analysis
- **Financial Model Validator**: Validate retention assumptions
- **Quarterly Portfolio Reporting**: Track portfolio company cohorts
- **Customer Reference Tracker**: Connect qualitative feedback

## Visualization Outputs

- Cohort retention heatmaps
- Retention curve comparisons
- LTV/CAC trend charts
- Cohort revenue waterfalls
- Segment comparison charts

## Best Practices

1. Use monthly cohorts for SaaS, adjust for business model
2. Separate new logo vs. expansion revenue
3. Analyze both count and revenue retention
4. Look for cohort quality degradation as signal
5. Segment analysis often reveals hidden patterns
