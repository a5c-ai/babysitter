# dbt Project Analyzer

A specialized skill for analyzing dbt (data build tool) projects to assess best practices adherence, performance optimization opportunities, and maintainability improvements.

## Overview

The dbt Project Analyzer examines your dbt project structure, model dependencies, testing coverage, and documentation completeness. It generates a comprehensive health report with actionable recommendations for improvement.

## Quick Start

```bash
# Basic usage
/skill dbt-project-analyzer --projectPath ./my-dbt-project

# With specific focus areas
/skill dbt-project-analyzer --projectPath ./analytics --focusAreas performance,testing
```

## Features

### 1. Model Dependency Analysis

Analyzes the directed acyclic graph (DAG) of your dbt models to identify:

- Circular dependency risks
- Overly deep model chains
- Orphaned models
- Bottleneck models (high fan-in/fan-out)

### 2. Test Coverage Analysis

Evaluates test coverage across your project:

- Primary key uniqueness and not-null tests
- Referential integrity tests
- Custom data quality tests
- Column-level test coverage metrics

### 3. Documentation Completeness

Checks documentation coverage:

- Model descriptions
- Column descriptions
- Source definitions
- YAML schema files

### 4. Naming Convention Validation

Enforces dbt naming best practices:

- Staging models: `stg_<source>__<entity>`
- Intermediate models: `int_<entity>_<verb>`
- Mart models: `fct_<entity>` or `dim_<entity>`
- Consistent casing and prefixes

### 5. Performance Recommendations

Identifies optimization opportunities:

- Incremental model candidates
- Materialization strategy improvements
- Partition and cluster key suggestions
- Query efficiency patterns

### 6. Incremental Model Assessment

For incremental models specifically:

- Strategy evaluation (append, merge, delete+insert)
- Unique key configuration
- On schema change handling
- Lookback window optimization

## Output Report

The analysis generates a structured report including:

```json
{
  "healthScore": 78,
  "metrics": {
    "testCoverage": 65.5,
    "docCoverage": 45.2,
    "incrementalRatio": 30.0,
    "totalModels": 124,
    "totalTests": 287
  },
  "issues": [
    {
      "severity": "error",
      "category": "testing",
      "model": "fct_orders",
      "message": "No unique test on primary key",
      "recommendation": "Add unique test on order_id column"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "category": "performance",
      "description": "Convert stg_orders to incremental",
      "effort": "2-4 hours",
      "impact": "50% build time reduction"
    }
  ]
}
```

## Integration

### With dbt MCP Server

For enhanced capabilities, configure the dbt MCP server:

```json
{
  "mcpServers": {
    "dbt": {
      "command": "npx",
      "args": ["-y", "@dbt-labs/dbt-mcp"]
    }
  }
}
```

### With Babysitter Processes

This skill is used by the following processes:

- **dbt-project-setup.js** - Initial project scaffolding and validation
- **dbt-model-development.js** - Model development workflow
- **metrics-layer.js** - Semantic layer setup
- **incremental-model.js** - Incremental model optimization

## Configuration

### Analysis Depth

| Level | Description | Duration |
|-------|-------------|----------|
| `quick` | Basic structure and naming checks | ~30 seconds |
| `standard` | Full analysis excluding deep performance | ~2 minutes |
| `deep` | Complete analysis with query profiling | ~5+ minutes |

### Focus Areas

Specify specific areas to analyze:

- `performance` - Materialization, incrementals, query efficiency
- `testing` - Test coverage and quality
- `documentation` - Description and schema completeness
- `naming` - Convention adherence
- `incremental` - Incremental model optimization
- `dependencies` - DAG analysis and complexity

## Best Practices Enforced

### Model Organization

```
models/
  staging/
    stripe/
      _stripe__models.yml
      _stripe__sources.yml
      stg_stripe__payments.sql
  intermediate/
    int_payments_pivoted.sql
  marts/
    core/
      dim_customers.sql
      fct_orders.sql
```

### Required Tests

Every model should have:

1. Unique test on primary key
2. Not-null test on primary key
3. Relationship tests for foreign keys
4. Accepted values for enum columns

### Documentation Standards

```yaml
models:
  - name: fct_orders
    description: "Order fact table with one row per order"
    columns:
      - name: order_id
        description: "Primary key"
        tests:
          - unique
          - not_null
```

## Troubleshooting

### Common Issues

**"Manifest not found"**
- Run `dbt compile` or `dbt build` first
- Check target directory path

**"Analysis timeout"**
- Use `quick` depth for initial assessment
- Focus on specific areas

**"Missing source definitions"**
- Create `_<source>__sources.yml` files
- Use `dbt source freshness` to validate

## References

- [dbt Best Practices](https://docs.getdbt.com/best-practices)
- [How we structure our dbt projects](https://docs.getdbt.com/guides/best-practices/how-we-structure/1-guide-overview)
- [dbt Style Guide](https://github.com/dbt-labs/corp/blob/main/dbt_style_guide.md)
- [Elementary Data Testing](https://docs.elementary-data.com/)

## Version

- **Current Version**: 1.0.0
- **Skill ID**: SK-DEA-003
- **Category**: Transformation
