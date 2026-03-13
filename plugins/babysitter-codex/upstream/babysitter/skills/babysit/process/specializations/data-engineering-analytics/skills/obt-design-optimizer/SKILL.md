---
name: OBT Design Optimizer
description: Designs and optimizes One Big Table (OBT) patterns
version: 1.0.0
category: Data Modeling
skillId: SK-DEA-020
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# OBT Design Optimizer

## Overview

Designs and optimizes One Big Table (OBT) patterns. This skill balances denormalization benefits with maintainability for analytical use cases.

## Capabilities

- Column selection optimization
- Denormalization strategy
- Nested/repeated field design (BigQuery)
- Clustering key selection
- Partition strategy
- Update frequency optimization
- Query pattern analysis
- Storage vs. performance tradeoffs

## Input Schema

```json
{
  "sourceModels": ["object"],
  "queryPatterns": ["object"],
  "platform": "snowflake|bigquery|redshift",
  "constraints": {
    "maxColumns": "number",
    "refreshFrequency": "string"
  }
}
```

## Output Schema

```json
{
  "obtDesign": {
    "columns": ["object"],
    "clustering": ["string"],
    "partitioning": "object"
  },
  "buildStrategy": "object",
  "refreshConfig": "object",
  "estimatedQueryImprovement": "percentage"
}
```

## Target Processes

- OBT Creation
- BI Dashboard Development
- Query Optimization

## Usage Guidelines

1. Analyze source models and relationships
2. Document common query patterns
3. Define platform and constraints
4. Balance column count with query needs

## Best Practices

- Include only columns needed for known query patterns
- Use appropriate clustering for common filter columns
- Partition by date for time-series analysis
- Schedule refreshes based on source update frequency
- Monitor query performance and adjust design
