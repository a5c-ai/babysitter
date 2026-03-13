---
name: Great Expectations Generator
description: Generates Great Expectations suites from data profiles and business rules
version: 1.0.0
category: Data Quality
skillId: SK-DEA-006
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Great Expectations Generator

## Overview

Generates Great Expectations suites from data profiles and business rules. This skill automates the creation of comprehensive expectation suites that enforce data quality constraints.

## Capabilities

- Expectation suite generation from profiling
- Custom expectation creation
- Checkpoint configuration
- Data docs generation
- Validation result analysis
- Expectation parameterization
- Suite versioning recommendations
- Integration with dbt and Airflow

## Input Schema

```json
{
  "dataProfile": "object",
  "businessRules": ["object"],
  "existingSuite": "object",
  "strictness": "strict|moderate|lenient"
}
```

## Output Schema

```json
{
  "expectationSuite": "object",
  "checkpointConfig": "object",
  "documentation": "string",
  "coverageReport": {
    "columnsWithExpectations": "number",
    "totalExpectations": "number"
  }
}
```

## Target Processes

- Data Quality Framework
- ETL/ELT Pipeline
- dbt Project Setup

## Usage Guidelines

1. Provide data profile results from profiling analysis
2. Define business rules that should be enforced
3. Specify strictness level based on use case requirements
4. Include existing suite if extending an existing configuration

## Best Practices

- Start with moderate strictness and adjust based on validation results
- Include both column-level and table-level expectations
- Document business rationale for each custom expectation
- Version expectation suites alongside data transformations
- Configure appropriate data docs for stakeholder visibility
