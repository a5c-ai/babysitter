---
name: Cost Optimizer (Cloud Data Platforms)
description: Analyzes and optimizes costs for cloud data platforms
version: 1.0.0
category: Cost Management
skillId: SK-DEA-012
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Cost Optimizer (Cloud Data Platforms)

## Overview

Analyzes and optimizes costs for cloud data platforms. This skill provides deep expertise in platform-specific cost structures and optimization strategies.

## Capabilities

- Snowflake credit analysis and optimization
- BigQuery slot and on-demand optimization
- Redshift node sizing
- Storage cost optimization
- Query cost estimation
- Warehouse scheduling recommendations
- Data lifecycle policy recommendations
- Reserved capacity planning

## Input Schema

```json
{
  "platform": "snowflake|bigquery|redshift|databricks",
  "usageMetrics": "object",
  "billingData": "object",
  "queryHistory": "object"
}
```

## Output Schema

```json
{
  "currentCost": "number",
  "optimizedCost": "number",
  "savings": "percentage",
  "recommendations": [{
    "category": "string",
    "action": "string",
    "impact": "number",
    "effort": "low|medium|high"
  }]
}
```

## Target Processes

- Data Warehouse Setup
- Query Optimization
- Pipeline Migration

## Usage Guidelines

1. Provide platform-specific usage metrics
2. Include billing data for cost baseline
3. Share query history for optimization analysis
4. Prioritize recommendations by impact and effort

## Best Practices

- Regularly review and optimize warehouse sizes
- Implement auto-suspend and auto-resume policies
- Use clustering and partitioning to reduce scan costs
- Consider reserved capacity for predictable workloads
- Monitor and alert on cost anomalies
