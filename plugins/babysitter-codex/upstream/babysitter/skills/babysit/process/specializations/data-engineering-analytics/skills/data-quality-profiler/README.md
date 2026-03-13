# Data Quality Profiler

A comprehensive skill for profiling data assets, assessing quality dimensions, detecting anomalies, and generating actionable data quality reports.

## Overview

The Data Quality Profiler examines your data assets across the six core data quality dimensions: completeness, accuracy, consistency, validity, timeliness, and uniqueness. It generates statistical profiles, identifies anomalies, detects PII, and provides prioritized recommendations.

## Quick Start

```bash
# Profile a database table
/skill data-quality-profiler --dataSource.type table --dataSource.identifier customers

# Profile a CSV file with PII detection
/skill data-quality-profiler --dataSource.type file --dataSource.identifier ./data.csv --piiDetection true

# Full quality assessment
/skill data-quality-profiler --dimensions completeness,validity,accuracy,consistency,timeliness,uniqueness
```

## Features

### 1. Statistical Profiling

Generates comprehensive statistics for each column:

```json
{
  "name": "order_total",
  "statistics": {
    "nullCount": 0,
    "nullPercent": 0,
    "distinctCount": 45678,
    "min": 0.01,
    "max": 99999.99,
    "mean": 156.78,
    "median": 89.50,
    "stddev": 234.56,
    "percentiles": {
      "p25": 45.00,
      "p75": 175.00,
      "p95": 450.00,
      "p99": 1200.00
    }
  }
}
```

### 2. Anomaly Detection

Automatically identifies data anomalies:

| Type | Description | Example |
|------|-------------|---------|
| Outlier | Values beyond statistical norms | Age = 250 |
| Drift | Changes from historical patterns | 50% more nulls than usual |
| Unexpected null | Nulls in typically complete columns | Required field is null |
| Format violation | Invalid format patterns | Email without @ |

### 3. PII Detection

Identifies sensitive data automatically:

```json
{
  "piiFindings": [
    {
      "column": "contact_info",
      "piiType": "email",
      "confidence": 0.95,
      "sampleCount": 9823,
      "recommendation": "Consider masking or encryption"
    },
    {
      "column": "tax_id",
      "piiType": "ssn",
      "confidence": 0.87,
      "recommendation": "Implement tokenization"
    }
  ]
}
```

### 4. Quality Dimension Scoring

Scores data across six dimensions:

| Dimension | What It Measures | Score Range |
|-----------|------------------|-------------|
| Completeness | Presence of data | 0-100 |
| Accuracy | Correctness vs truth | 0-100 |
| Consistency | Uniformity | 0-100 |
| Validity | Business rule conformance | 0-100 |
| Timeliness | Freshness | 0-100 |
| Uniqueness | Duplicate detection | 0-100 |

### 5. Drift Detection

Compare current profile to historical baseline:

```json
{
  "drift": {
    "schemaChanges": [
      {"type": "column_added", "column": "new_field"},
      {"type": "type_changed", "column": "id", "from": "INT", "to": "BIGINT"}
    ],
    "statisticalDrift": [
      {
        "column": "revenue",
        "metric": "mean",
        "baseline": 156.78,
        "current": 189.45,
        "changePercent": 20.8,
        "significant": true
      }
    ],
    "volumeChange": {
      "baseline": 1000000,
      "current": 1150000,
      "changePercent": 15
    }
  }
}
```

## Output Report

### Overall Quality Score

```json
{
  "overallScore": 85.5,
  "dimensionScores": {
    "completeness": 95.2,
    "validity": 88.7,
    "uniqueness": 99.1,
    "consistency": 82.3,
    "accuracy": 78.5,
    "timeliness": 69.2
  },
  "grade": "B+"
}
```

### Column-Level Details

```json
{
  "columns": [
    {
      "name": "customer_email",
      "inferredType": "email",
      "qualityScores": {
        "completeness": 98.5,
        "validity": 94.2,
        "uniqueness": 99.8
      },
      "issues": [
        "1.5% null values",
        "5.8% invalid email format"
      ]
    }
  ]
}
```

### Prioritized Recommendations

```json
{
  "recommendations": [
    {
      "priority": "high",
      "category": "validity",
      "column": "phone_number",
      "description": "15% of phone numbers have invalid format",
      "impact": "Customer communication failures",
      "action": "Implement validation at ingestion"
    },
    {
      "priority": "medium",
      "category": "completeness",
      "column": "address_line2",
      "description": "65% null values",
      "impact": "Incomplete shipping addresses",
      "action": "Review if field is required"
    }
  ]
}
```

## Use Cases

### 1. Pre-Migration Profiling

Before migrating data to a new system:

```json
{
  "dataSource": {"type": "table", "identifier": "legacy.customers"},
  "dimensions": ["completeness", "validity", "uniqueness"],
  "piiDetection": true
}
```

### 2. Pipeline Quality Gate

In data pipelines for quality checks:

```json
{
  "dataSource": {
    "type": "query",
    "identifier": "SELECT * FROM staging.daily_orders WHERE load_date = CURRENT_DATE"
  },
  "businessRules": [
    {"column": "order_id", "rule": "unique"},
    {"column": "amount", "rule": "range", "min": 0, "max": 100000}
  ]
}
```

### 3. Regulatory Compliance

For PII inventory and compliance:

```json
{
  "dataSource": {"type": "table", "identifier": "customer_data"},
  "piiDetection": true,
  "dimensions": ["validity"]
}
```

### 4. Data Drift Monitoring

Regular profiling to detect drift:

```json
{
  "dataSource": {"type": "table", "identifier": "fact_transactions"},
  "previousProfile": {...},
  "dimensions": ["consistency", "timeliness"]
}
```

## Business Rules

Define custom validation rules:

```json
{
  "businessRules": [
    {
      "column": "age",
      "rule": "range",
      "min": 0,
      "max": 120,
      "description": "Age must be between 0 and 120"
    },
    {
      "column": "status",
      "rule": "in_set",
      "values": ["active", "inactive", "pending"],
      "description": "Status must be one of the allowed values"
    },
    {
      "column": "created_at",
      "rule": "not_future",
      "description": "Created date cannot be in the future"
    },
    {
      "column": "email",
      "rule": "format",
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  ]
}
```

## Integration

### With Great Expectations

Generate expectation suites from profiles:

```bash
# Profile first
/skill data-quality-profiler --dataSource.identifier orders

# Then generate expectations
/skill great-expectations-generator --dataProfile <profile-output>
```

### With dbt

Use in dbt testing workflows:

```yaml
# dbt schema.yml
models:
  - name: customers
    tests:
      - dq_profiler:
          dimensions: [completeness, validity]
          fail_threshold: 80
```

### With Elementary

Enhanced observability integration:

- Automatic anomaly detection
- Trend visualization
- Alert integration

## Performance Considerations

### Sample Sizing

| Table Size | Recommended Sample | Accuracy |
|------------|-------------------|----------|
| < 10K rows | Full scan | 100% |
| 10K - 1M | 50,000 | 99%+ |
| 1M - 100M | 100,000 | 98%+ |
| > 100M | 500,000 | 97%+ |

### Query Optimization

For large tables:
- Use partitioned queries when possible
- Leverage columnar storage statistics
- Consider approximate distinct counts

## Troubleshooting

### Common Issues

**"Connection timeout"**
- Reduce sample size
- Check network connectivity
- Verify credentials

**"Memory exceeded"**
- Enable streaming profile mode
- Reduce dimensions analyzed
- Profile subsets of columns

**"PII detection slow"**
- Disable if not needed
- Reduce sample size for PII scan
- Use column name heuristics only

## References

- [DAMA Data Quality Dimensions](https://www.dama.org/cpages/body-of-knowledge)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [Elementary Data Observability](https://docs.elementary-data.com/)
- [Data Quality Fundamentals](https://www.oreilly.com/library/view/data-quality-fundamentals/9781098112035/)

## Version

- **Current Version**: 1.0.0
- **Skill ID**: SK-DEA-005
- **Category**: Data Quality
