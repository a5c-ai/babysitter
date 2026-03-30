---
name: Incremental Model Strategy Selector
description: Selects and configures optimal incremental model strategies
version: 1.0.0
category: Transformation
skillId: SK-DEA-019
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Incremental Model Strategy Selector

## Overview

Selects and configures optimal incremental model strategies. This skill optimizes data transformation efficiency through proper incremental processing patterns.

## Capabilities

- Incremental strategy selection (append, merge, delete+insert)
- Partition pruning optimization
- Unique key configuration
- On_schema_change handling
- Full refresh scheduling
- Lookback window optimization
- Late-arriving data handling

## Input Schema

```json
{
  "modelCharacteristics": {
    "sourceType": "string",
    "updatePattern": "append|update|delete",
    "volumeGB": "number",
    "updateFrequency": "string"
  },
  "platform": "snowflake|bigquery|redshift",
  "existingModel": "object"
}
```

## Output Schema

```json
{
  "strategy": "append|merge|delete+insert",
  "config": "object",
  "partitionStrategy": "object",
  "refreshSchedule": "object",
  "dbtConfig": "object"
}
```

## Target Processes

- Incremental Model Setup
- dbt Model Development
- Pipeline Migration

## Usage Guidelines

1. Analyze source data update patterns
2. Measure data volume and update frequency
3. Select strategy based on characteristics
4. Configure appropriate lookback windows

## Best Practices

- Use append for insert-only sources
- Use merge for sources with updates
- Configure partition pruning for large tables
- Schedule periodic full refreshes for data correction
- Handle late-arriving data with appropriate lookback
