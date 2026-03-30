---
name: Dimensional Model Validator
description: Validates dimensional models against Kimball methodology best practices
version: 1.0.0
category: Data Modeling
skillId: SK-DEA-008
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Dimensional Model Validator

## Overview

Validates dimensional models against Kimball methodology best practices. This skill ensures dimensional models conform to proven design patterns for analytical workloads.

## Capabilities

- Star/snowflake schema validation
- Grain definition verification
- Surrogate key design validation
- SCD type appropriateness check
- Conformed dimension analysis
- Fact table type validation (transaction, periodic, accumulating)
- Degenerate dimension identification
- Role-playing dimension detection
- Bus matrix compliance checking

## Input Schema

```json
{
  "model": {
    "facts": ["object"],
    "dimensions": ["object"],
    "relationships": ["object"]
  },
  "businessProcess": "string",
  "busMatrix": "object"
}
```

## Output Schema

```json
{
  "validationScore": "number",
  "issues": [{
    "severity": "error|warning|info",
    "element": "string",
    "rule": "string",
    "message": "string"
  }],
  "suggestions": ["string"],
  "conformedDimensionOpportunities": ["object"]
}
```

## Target Processes

- Dimensional Model Design
- Data Warehouse Setup
- OBT Creation

## Usage Guidelines

1. Provide complete model definition with facts, dimensions, and relationships
2. Include business process context for grain validation
3. Supply bus matrix if checking conformed dimension compliance
4. Review all issues, prioritizing errors before warnings

## Best Practices

- Validate grain definition before proceeding with implementation
- Ensure surrogate keys are system-generated, not business keys
- Check for conformed dimension opportunities across subject areas
- Verify fact table type matches the business process characteristics
- Document role-playing dimensions clearly
