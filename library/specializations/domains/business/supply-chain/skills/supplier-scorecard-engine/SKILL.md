---
name: supplier-scorecard-engine
description: Automated supplier performance scorecard generation with KPI tracking and trend analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: supplier-management
  priority: high
---

# Supplier Scorecard Engine

## Overview

The Supplier Scorecard Engine automates the generation and maintenance of supplier performance scorecards. It aggregates performance data across multiple KPI categories, calculates weighted scores, tracks trends, and generates actionable insights for supplier management.

## Capabilities

- **OTIF Calculation**: On-Time In-Full delivery performance
- **Quality Metrics Aggregation**: PPM, defect rate, inspection results
- **Cost Performance Tracking**: Price variance, savings achievement
- **Responsiveness Scoring**: Issue resolution, communication metrics
- **Sustainability/ESG Metrics**: Environmental and social performance
- **Weighted Composite Scoring**: Configurable weighting by category
- **Trend and Benchmark Analysis**: Performance trending and peer comparison
- **Action Plan Tracking**: Improvement initiative monitoring

## Input Schema

```yaml
scorecard_request:
  supplier_id: string
  evaluation_period:
    start_date: date
    end_date: date
  performance_data:
    delivery:
      orders_received: integer
      on_time: integer
      in_full: integer
    quality:
      units_received: integer
      defects: integer
      returns: integer
    cost:
      contracted_spend: float
      actual_spend: float
      savings_target: float
    responsiveness:
      issues_raised: integer
      issues_resolved: integer
      avg_resolution_time: float
    sustainability:
      certifications: array
      esg_score: float
  weighting_profile: object
  benchmark_data: object
```

## Output Schema

```yaml
scorecard_output:
  supplier_id: string
  period: object
  category_scores:
    delivery:
      otif_percent: float
      score: float
      trend: string
    quality:
      ppm: float
      score: float
      trend: string
    cost:
      variance_percent: float
      score: float
      trend: string
    responsiveness:
      resolution_rate: float
      score: float
      trend: string
    sustainability:
      score: float
      trend: string
  composite_score: float
  rating: string                    # A, B, C, D, F
  benchmark_comparison: object
  action_items: array
  trend_analysis: object
```

## Usage

### Monthly Scorecard Generation

```
Input: Previous month's delivery, quality, cost data
Process: Calculate KPIs, apply weights, generate score
Output: Comprehensive supplier scorecard with rating
```

### Trend Analysis

```
Input: 12 months of scorecard history
Process: Analyze performance trajectory by category
Output: Trend report with improvement/decline identification
```

### Benchmark Comparison

```
Input: Supplier scorecard, peer group data
Process: Compare against category averages and best-in-class
Output: Relative performance positioning
```

## Integration Points

- **ERP Systems**: Purchase orders, receipts, quality data
- **Quality Systems**: Inspection results, NCRs
- **BI Platforms**: Scorecard visualization and distribution
- **Tools/Libraries**: Scorecard templates, analytics frameworks

## Process Dependencies

- Supplier Performance Scorecard
- Quarterly Business Review (QBR) Facilitation
- Supplier Development Program

## Best Practices

1. Define clear KPI definitions and measurement methods
2. Establish data collection automation where possible
3. Calibrate weights based on category importance
4. Share scorecards with suppliers transparently
5. Link scorecard results to business allocation
6. Review weighting profiles annually
