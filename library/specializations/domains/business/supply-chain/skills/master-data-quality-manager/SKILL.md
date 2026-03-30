---
name: master-data-quality-manager
description: Supply chain master data quality monitoring and improvement skill
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: cross-functional
  priority: future
---

# Master Data Quality Manager

## Overview

The Master Data Quality Manager provides supply chain master data quality monitoring, validation, and improvement capabilities. It ensures data accuracy across item, supplier, location, and BOM master data to support reliable supply chain operations and analytics.

## Capabilities

- **Item Master Data Validation**: Product data completeness and accuracy
- **Supplier Master Data Cleansing**: Vendor data quality improvement
- **Location/Plant Data Verification**: Facility data accuracy
- **BOM Accuracy Checking**: Bill of materials validation
- **Lead Time Validation**: Lead time data accuracy assessment
- **Data Completeness Scoring**: Missing data identification
- **Duplicate Detection**: Redundant record identification
- **Data Quality Trending**: Quality metric tracking over time

## Input Schema

```yaml
data_quality_request:
  data_domains:
    item_master: boolean
    supplier_master: boolean
    location_master: boolean
    bom_master: boolean
    lead_time: boolean
  validation_rules:
    completeness_rules: array
    accuracy_rules: array
    consistency_rules: array
    timeliness_rules: array
  data_sources:
    erp_system: string
    extract_files: array
  quality_thresholds:
    critical_fields: object
    acceptable_error_rate: float
```

## Output Schema

```yaml
data_quality_output:
  quality_scorecard:
    overall_score: float
    by_domain: object
      item_master:
        completeness: float
        accuracy: float
        consistency: float
        timeliness: float
      supplier_master:
        completeness: float
        accuracy: float
        consistency: float
        timeliness: float
      location_master:
        completeness: float
        accuracy: float
      bom_master:
        completeness: float
        accuracy: float
      lead_time:
        accuracy: float
  issues_identified:
    critical: array
    high: array
    medium: array
    low: array
  duplicate_analysis:
    potential_duplicates: array
    merge_recommendations: array
  completeness_report:
    missing_fields: array
    missing_by_domain: object
  data_cleansing_actions:
    recommended_fixes: array
    automated_corrections: array
    manual_review_required: array
  trend_analysis:
    quality_over_time: object
    improvement_areas: array
    degradation_alerts: array
```

## Usage

### Comprehensive Data Quality Assessment

```
Input: Master data extracts, validation rules
Process: Validate against quality rules
Output: Data quality scorecard with issues
```

### Duplicate Detection and Resolution

```
Input: Supplier or item master data
Process: Identify potential duplicates
Output: Duplicate report with merge recommendations
```

### Lead Time Data Validation

```
Input: Lead time master, historical receipt data
Process: Compare stated vs. actual lead times
Output: Lead time accuracy report
```

## Integration Points

- **ERP Systems**: Master data extraction
- **MDM Platforms**: Master data management integration
- **Data Quality Tools**: Profiling and cleansing platforms
- **Tools/Libraries**: Data quality frameworks, MDM platforms

## Process Dependencies

- All supply chain processes (cross-cutting)
- Demand Forecasting and Planning
- Inventory Optimization and Segmentation

## Best Practices

1. Define clear data ownership
2. Establish data quality metrics and targets
3. Implement preventive data quality controls
4. Schedule regular data quality reviews
5. Automate data quality monitoring
6. Address root causes, not just symptoms
