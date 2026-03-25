---
name: SCD Implementation Generator
description: Generates Slowly Changing Dimension implementations across platforms
version: 1.0.0
category: Data Modeling
skillId: SK-DEA-016
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# SCD Implementation Generator

## Overview

Generates Slowly Changing Dimension implementations across platforms. This skill automates the creation of SCD patterns for proper historical tracking.

## Capabilities

- SCD Type 1/2/3/4/6 implementation
- MERGE statement generation
- dbt snapshot configuration
- Historical tracking optimization
- Surrogate key management
- Effective date handling
- Current flag management
- Mini-dimension design

## Input Schema

```json
{
  "dimension": {
    "name": "string",
    "columns": ["object"],
    "businessKey": ["string"]
  },
  "scdType": "1|2|3|4|6",
  "platform": "snowflake|bigquery|redshift|dbt",
  "trackingColumns": ["string"]
}
```

## Output Schema

```json
{
  "ddl": "string",
  "mergeStatement": "string",
  "dbtConfig": "object",
  "documentation": "string"
}
```

## Target Processes

- SCD Implementation
- Dimensional Model Design
- dbt Model Development

## Usage Guidelines

1. Define dimension structure with business keys
2. Select appropriate SCD type for business requirements
3. Specify target platform for syntax generation
4. Identify columns to track for historical changes

## Best Practices

- Use SCD Type 2 for attributes requiring full history
- Implement surrogate keys for dimension tables
- Use effective dates rather than just current flags
- Consider mini-dimensions for rapidly changing attributes
- Test SCD logic with representative change scenarios
