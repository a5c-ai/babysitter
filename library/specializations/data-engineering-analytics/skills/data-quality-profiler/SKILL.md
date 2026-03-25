---
name: data-quality-profiler
description: Profiles data assets to assess quality dimensions, detect anomalies, and generate comprehensive data quality reports with actionable recommendations.
version: 1.0.0
category: Data Quality
skill-id: SK-DEA-005
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# Data Quality Profiler

Profiles data assets to assess quality dimensions and detect anomalies across the six core data quality dimensions.

## Overview

This skill performs comprehensive data profiling to assess completeness, accuracy, consistency, validity, timeliness, and uniqueness. It generates statistical profiles, detects anomalies, identifies PII, and provides actionable recommendations for data quality improvement.

## Capabilities

- **Statistical profiling** - Distributions, cardinality, null percentages, min/max values
- **Data type inference and validation** - Detect actual vs declared types
- **Pattern detection** - Regex patterns, formats, common structures
- **Anomaly detection** - Outliers, drift, unexpected values
- **Referential integrity checking** - Foreign key validation
- **Freshness monitoring** - Data age and update frequency
- **Volume trend analysis** - Record count patterns over time
- **Schema change detection** - Structural changes between runs
- **Cross-column correlation analysis** - Identify dependent columns
- **PII detection and classification** - Sensitive data identification

## Input Schema

```json
{
  "dataSource": {
    "type": "object",
    "required": true,
    "properties": {
      "type": {
        "type": "string",
        "enum": ["table", "file", "query"],
        "description": "Type of data source"
      },
      "connection": {
        "type": "object",
        "description": "Connection details (platform, database, schema)"
      },
      "identifier": {
        "type": "string",
        "description": "Table name, file path, or query string"
      }
    }
  },
  "sampleSize": {
    "type": "number",
    "description": "Number of rows to sample (null for full scan)",
    "default": 10000
  },
  "dimensions": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["accuracy", "completeness", "consistency", "validity", "timeliness", "uniqueness"]
    },
    "default": ["completeness", "validity", "uniqueness"],
    "description": "Quality dimensions to assess"
  },
  "previousProfile": {
    "type": "object",
    "description": "Previous profile for drift detection"
  },
  "businessRules": {
    "type": "array",
    "items": {
      "column": "string",
      "rule": "string",
      "threshold": "number"
    },
    "description": "Custom business rules to validate"
  },
  "piiDetection": {
    "type": "boolean",
    "default": true,
    "description": "Enable PII detection and classification"
  }
}
```

## Output Schema

```json
{
  "profile": {
    "type": "object",
    "properties": {
      "tableName": "string",
      "rowCount": "number",
      "columnCount": "number",
      "profileTimestamp": "string",
      "columns": {
        "type": "array",
        "items": {
          "name": "string",
          "declaredType": "string",
          "inferredType": "string",
          "statistics": {
            "nullCount": "number",
            "nullPercent": "number",
            "distinctCount": "number",
            "distinctPercent": "number",
            "min": "any",
            "max": "any",
            "mean": "number",
            "median": "number",
            "stddev": "number",
            "histogram": "array"
          },
          "patterns": {
            "mostCommon": "array",
            "detectedFormat": "string",
            "regexPattern": "string"
          },
          "qualityScores": {
            "completeness": "number",
            "validity": "number",
            "uniqueness": "number"
          }
        }
      }
    }
  },
  "anomalies": {
    "type": "array",
    "items": {
      "column": "string",
      "type": "outlier|drift|unexpected_null|unexpected_value|format_violation",
      "severity": "high|medium|low",
      "description": "string",
      "examples": "array",
      "recommendation": "string"
    }
  },
  "piiFindings": {
    "type": "array",
    "items": {
      "column": "string",
      "piiType": "email|phone|ssn|credit_card|name|address|ip|custom",
      "confidence": "number",
      "sampleCount": "number",
      "recommendation": "string"
    }
  },
  "overallScore": {
    "type": "number",
    "description": "Weighted quality score (0-100)"
  },
  "dimensionScores": {
    "completeness": "number",
    "accuracy": "number",
    "consistency": "number",
    "validity": "number",
    "timeliness": "number",
    "uniqueness": "number"
  },
  "recommendations": {
    "type": "array",
    "items": {
      "priority": "high|medium|low",
      "category": "string",
      "description": "string",
      "impact": "string"
    }
  },
  "drift": {
    "type": "object",
    "description": "Changes compared to previous profile",
    "properties": {
      "schemaChanges": "array",
      "statisticalDrift": "array",
      "volumeChange": "object"
    }
  }
}
```

## Usage Examples

### Basic Table Profiling

```json
{
  "dataSource": {
    "type": "table",
    "connection": {
      "platform": "snowflake",
      "database": "analytics",
      "schema": "core"
    },
    "identifier": "dim_customers"
  },
  "dimensions": ["completeness", "validity", "uniqueness"]
}
```

### File Profiling with PII Detection

```json
{
  "dataSource": {
    "type": "file",
    "identifier": "./data/customer_export.csv"
  },
  "sampleSize": 50000,
  "piiDetection": true,
  "dimensions": ["completeness", "validity", "accuracy"]
}
```

### Query-Based Profiling with Business Rules

```json
{
  "dataSource": {
    "type": "query",
    "connection": {
      "platform": "bigquery",
      "project": "my-project"
    },
    "identifier": "SELECT * FROM orders WHERE order_date >= '2024-01-01'"
  },
  "businessRules": [
    {"column": "order_total", "rule": "positive", "threshold": 0},
    {"column": "status", "rule": "in_set", "values": ["pending", "completed", "cancelled"]},
    {"column": "customer_id", "rule": "not_null", "threshold": 100}
  ]
}
```

### Drift Detection

```json
{
  "dataSource": {
    "type": "table",
    "identifier": "fact_sales"
  },
  "previousProfile": {
    "profileTimestamp": "2024-01-01T00:00:00Z",
    "rowCount": 1000000,
    "columns": [...]
  },
  "dimensions": ["consistency", "timeliness"]
}
```

## Quality Dimensions

### Completeness (0-100)

Measures the presence of required data:

| Metric | Calculation |
|--------|-------------|
| Column completeness | (total - nulls) / total * 100 |
| Row completeness | rows with all required fields / total rows * 100 |
| Overall | Weighted average across columns |

### Validity (0-100)

Measures conformance to business rules:

| Check Type | Example |
|------------|---------|
| Type conformance | String in INT column |
| Format conformance | Invalid email format |
| Range conformance | Age > 150 |
| Referential | FK without matching PK |

### Uniqueness (0-100)

Measures duplicate and cardinality:

| Metric | Calculation |
|--------|-------------|
| Distinct ratio | distinct / total * 100 |
| Duplicate count | total - distinct |
| PK uniqueness | unique PKs / total * 100 |

### Accuracy (0-100)

Measures correctness against ground truth:

- Requires reference data or business rules
- Cross-validates related columns
- Checks mathematical relationships

### Consistency (0-100)

Measures uniformity across the dataset:

- Format consistency (dates, numbers)
- Categorical value consistency
- Cross-column logical consistency

### Timeliness (0-100)

Measures data freshness:

| Metric | Threshold |
|--------|-----------|
| Data age | Hours since last update |
| Freshness SLA | % meeting freshness requirement |
| Lag detection | Processing delay measurement |

## PII Detection Categories

| Type | Pattern Examples |
|------|------------------|
| Email | xxx@domain.com |
| Phone | (XXX) XXX-XXXX, +1-XXX-XXX-XXXX |
| SSN | XXX-XX-XXXX |
| Credit Card | XXXX-XXXX-XXXX-XXXX (with Luhn check) |
| Name | First/Last name patterns |
| Address | Street, city, state, zip patterns |
| IP Address | IPv4 and IPv6 |

## Integration Points

### MCP Server Integration

- **Elementary MCP** - Data observability and anomaly detection
- **Database MCPs** - Direct profiling queries

### Related Skills

- Great Expectations Generator (SK-DEA-006) - Generate expectation suites from profiles
- Data Catalog Enricher (SK-DEA-017) - Enrich catalog with profile metadata

### Applicable Processes

- Data Quality Framework (`data-quality-framework.js`)
- Data Catalog (`data-catalog.js`)
- ETL/ELT Pipeline (`etl-elt-pipeline.js`)
- A/B Testing Pipeline (`ab-testing-pipeline.js`)

## References

- [Data Quality Dimensions - DAMA](https://www.dama.org/cpages/body-of-knowledge)
- [Great Expectations](https://docs.greatexpectations.io/)
- [Elementary Data](https://docs.elementary-data.com/)
- [Awesome Data Quality](https://github.com/kwanUm/awesome-data-quality)

## Version History

- **1.0.0** - Initial release with six dimension profiling and PII detection
