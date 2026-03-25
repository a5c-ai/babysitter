---
name: dbt-project-analyzer
description: Analyzes dbt projects for best practices, performance, maintainability, and generates actionable recommendations for improvement.
version: 1.0.0
category: Transformation
skill-id: SK-DEA-003
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# dbt Project Analyzer

Analyzes dbt projects for best practices, performance, and maintainability following dbt Labs recommended patterns.

## Overview

This skill examines dbt project structure, model dependencies, test coverage, documentation completeness, and adherence to naming conventions. It provides actionable recommendations for improving project health and maintainability.

## Capabilities

- **Model dependency graph analysis** - Visualize and analyze model relationships, detect circular dependencies
- **Incremental model optimization** - Evaluate incremental strategies and suggest improvements
- **Materialization strategy recommendations** - Recommend optimal materializations based on usage patterns
- **Test coverage analysis** - Measure and report on test coverage across models
- **Documentation completeness check** - Identify undocumented models, columns, and sources
- **Naming convention validation** - Enforce consistent naming patterns (staging, marts, intermediate)
- **Ref/source usage validation** - Detect hardcoded references and missing source definitions
- **Macro efficiency analysis** - Evaluate macro usage and suggest optimizations
- **Slim CI optimization** - Configure efficient CI builds with state comparison
- **Model contract validation** - Verify model contracts for type safety

## Input Schema

```json
{
  "projectPath": {
    "type": "string",
    "description": "Path to the dbt project root directory",
    "required": true
  },
  "manifestJson": {
    "type": "object",
    "description": "Parsed manifest.json from target/ directory (optional, will be loaded if not provided)"
  },
  "catalogJson": {
    "type": "object",
    "description": "Parsed catalog.json from target/ directory (optional)"
  },
  "runResults": {
    "type": "object",
    "description": "Parsed run_results.json for performance analysis (optional)"
  },
  "analysisDepth": {
    "type": "string",
    "enum": ["quick", "standard", "deep"],
    "default": "standard",
    "description": "Depth of analysis to perform"
  },
  "focusAreas": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["performance", "testing", "documentation", "naming", "incremental", "dependencies"]
    },
    "description": "Specific areas to focus analysis on (all if not specified)"
  }
}
```

## Output Schema

```json
{
  "healthScore": {
    "type": "number",
    "description": "Overall project health score (0-100)"
  },
  "issues": {
    "type": "array",
    "items": {
      "severity": "error|warning|info",
      "category": "string",
      "model": "string",
      "message": "string",
      "recommendation": "string",
      "line": "number"
    }
  },
  "metrics": {
    "testCoverage": {
      "type": "number",
      "description": "Percentage of models with tests"
    },
    "docCoverage": {
      "type": "number",
      "description": "Percentage of models/columns documented"
    },
    "incrementalRatio": {
      "type": "number",
      "description": "Percentage of eligible models using incremental"
    },
    "avgModelDepth": {
      "type": "number",
      "description": "Average depth in DAG"
    },
    "totalModels": {
      "type": "number"
    },
    "totalTests": {
      "type": "number"
    }
  },
  "recommendations": {
    "type": "array",
    "items": {
      "priority": "high|medium|low",
      "category": "string",
      "description": "string",
      "effort": "string",
      "impact": "string"
    }
  },
  "dependencyGraph": {
    "type": "object",
    "description": "Simplified dependency graph for visualization"
  }
}
```

## Usage Examples

### Basic Project Analysis

```bash
# Invoke skill for standard analysis
/skill dbt-project-analyzer --projectPath ./my-dbt-project
```

### Deep Analysis with Focus Areas

```json
{
  "projectPath": "./analytics",
  "analysisDepth": "deep",
  "focusAreas": ["performance", "testing", "incremental"]
}
```

### CI Integration Analysis

```json
{
  "projectPath": "./dbt_project",
  "manifestJson": "./target/manifest.json",
  "runResults": "./target/run_results.json",
  "focusAreas": ["performance"]
}
```

## Analysis Rules

### Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Staging | `stg_<source>__<entity>` | `stg_stripe__payments` |
| Intermediate | `int_<entity>_<verb>` | `int_payments_pivoted` |
| Marts | `fct_<entity>` or `dim_<entity>` | `fct_orders`, `dim_customers` |

### Test Coverage Requirements

| Severity | Condition |
|----------|-----------|
| Error | No unique/not_null test on primary key |
| Warning | < 50% columns have tests |
| Info | Missing relationship tests |

### Materialization Guidelines

| Model Type | Recommended | Reason |
|------------|-------------|--------|
| Staging | View or Ephemeral | Source transformations, low compute |
| Intermediate | Ephemeral | Reduce warehouse clutter |
| Marts | Table or Incremental | End-user queries, performance |
| Large tables (>1M rows) | Incremental | Reduce build time |

## Integration Points

### MCP Server Integration

This skill integrates with the official dbt MCP server for enhanced capabilities:

- **dbt-labs/dbt-mcp** - Project metadata discovery, model information, semantic layer querying
- **dbt Remote MCP Server** - Cloud-hosted dbt MCP with secure endpoint access

### Applicable Processes

- dbt Project Setup (`dbt-project-setup.js`)
- dbt Model Development (`dbt-model-development.js`)
- Metrics Layer (`metrics-layer.js`)
- Incremental Model Setup (`incremental-model.js`)

## References

- [dbt Best Practices](https://docs.getdbt.com/best-practices)
- [dbt Style Guide](https://github.com/dbt-labs/corp/blob/main/dbt_style_guide.md)
- [dbt Project Maturity](https://docs.getdbt.com/guides/best-practices/how-we-structure/1-guide-overview)
- [dbt MCP Server](https://github.com/dbt-labs/dbt-mcp)

## Version History

- **1.0.0** - Initial release with core analysis capabilities
