---
name: sql-query-optimizer
description: Analyzes and optimizes SQL queries across different data warehouse platforms (Snowflake, BigQuery, Redshift, Databricks) with platform-specific recommendations.
version: 1.0.0
category: SQL Optimization
skill-id: SK-DEA-004
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# SQL Query Optimizer

Analyzes and optimizes SQL queries across different data warehouse platforms with platform-specific recommendations.

## Overview

This skill examines SQL queries to identify performance bottlenecks, suggest optimizations, and provide platform-specific recommendations for Snowflake, BigQuery, Redshift, and Databricks. It analyzes query execution plans, recommends indexes/clustering keys, and identifies anti-patterns.

## Capabilities

- **Query execution plan analysis** - Parse and analyze EXPLAIN outputs
- **Index recommendations** - Suggest clustering keys, sort keys, partition keys
- **Join optimization** - Identify inefficient join patterns and suggest improvements
- **Subquery elimination** - Convert correlated subqueries to CTEs or joins
- **CTE optimization** - Materialize vs reference optimization
- **Window function optimization** - Frame and partition optimization
- **Predicate pushdown validation** - Verify filter pushdown effectiveness
- **Clustering key recommendations** - Platform-specific clustering strategies
- **Materialized view suggestions** - Identify candidates for materialized views
- **Platform-specific optimizations** - Snowflake, BigQuery, Redshift, Databricks

## Input Schema

```json
{
  "query": {
    "type": "string",
    "description": "The SQL query to analyze",
    "required": true
  },
  "platform": {
    "type": "string",
    "enum": ["snowflake", "bigquery", "redshift", "databricks", "postgres"],
    "required": true,
    "description": "Target data warehouse platform"
  },
  "tableStatistics": {
    "type": "object",
    "description": "Table statistics including row counts, column cardinality",
    "properties": {
      "tables": {
        "type": "array",
        "items": {
          "name": "string",
          "rowCount": "number",
          "sizeGB": "number",
          "columns": "array"
        }
      }
    }
  },
  "executionPlan": {
    "type": "object",
    "description": "Query execution plan (EXPLAIN output)"
  },
  "queryHistory": {
    "type": "object",
    "description": "Historical query performance metrics"
  },
  "optimizationGoals": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["latency", "cost", "throughput", "scan_reduction"]
    },
    "default": ["latency", "cost"]
  }
}
```

## Output Schema

```json
{
  "optimizedQuery": {
    "type": "string",
    "description": "The optimized SQL query"
  },
  "improvements": {
    "type": "array",
    "items": {
      "type": {
        "type": "string",
        "enum": ["join", "predicate", "aggregation", "cte", "window", "scan", "index"]
      },
      "description": "string",
      "impact": "high|medium|low",
      "lineNumber": "number",
      "originalCode": "string",
      "optimizedCode": "string"
    }
  },
  "indexRecommendations": {
    "type": "array",
    "items": {
      "table": "string",
      "type": "clustering|sort|partition|index",
      "columns": "array",
      "rationale": "string",
      "ddl": "string"
    }
  },
  "estimatedImprovement": {
    "scanReduction": {
      "type": "number",
      "description": "Percentage reduction in data scanned"
    },
    "timeReduction": {
      "type": "number",
      "description": "Percentage reduction in execution time"
    },
    "costReduction": {
      "type": "number",
      "description": "Percentage reduction in query cost"
    }
  },
  "antiPatterns": {
    "type": "array",
    "items": {
      "pattern": "string",
      "severity": "high|medium|low",
      "location": "string",
      "suggestion": "string"
    }
  },
  "platformSpecificNotes": {
    "type": "array",
    "items": "string"
  }
}
```

## Usage Examples

### Basic Query Optimization

```json
{
  "query": "SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.created_at > '2024-01-01'",
  "platform": "snowflake"
}
```

### With Execution Plan Analysis

```json
{
  "query": "SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id",
  "platform": "bigquery",
  "executionPlan": {
    "stages": [...],
    "totalBytesProcessed": 1073741824
  },
  "optimizationGoals": ["cost", "scan_reduction"]
}
```

### With Table Statistics

```json
{
  "query": "SELECT ... complex query ...",
  "platform": "redshift",
  "tableStatistics": {
    "tables": [
      {
        "name": "orders",
        "rowCount": 10000000,
        "sizeGB": 50,
        "columns": [
          {"name": "order_id", "cardinality": 10000000},
          {"name": "customer_id", "cardinality": 500000}
        ]
      }
    ]
  }
}
```

## Platform-Specific Optimizations

### Snowflake

| Optimization | Description |
|--------------|-------------|
| Clustering keys | Recommend micro-partition clustering |
| Result cache | Identify queries benefiting from caching |
| Query acceleration | Suggest QUERY_ACCELERATION_MAX_SCALE_FACTOR |
| Warehouse sizing | Right-size warehouse recommendations |

### BigQuery

| Optimization | Description |
|--------------|-------------|
| Partitioning | DATE/TIMESTAMP partitioning recommendations |
| Clustering | Up to 4 clustering columns |
| BI Engine | Identify BI Engine-eligible queries |
| Slots | Estimate slot usage optimization |

### Redshift

| Optimization | Description |
|--------------|-------------|
| Sort keys | COMPOUND vs INTERLEAVED recommendations |
| Distribution | KEY, EVEN, ALL distribution strategies |
| Compression | Column encoding recommendations |
| Vacuum | VACUUM and ANALYZE recommendations |

### Databricks

| Optimization | Description |
|--------------|-------------|
| Z-ordering | Multi-column Z-order recommendations |
| Delta cache | Caching strategy recommendations |
| Photon | Photon-eligible query patterns |
| Adaptive execution | AQE configuration suggestions |

## Common Anti-Patterns Detected

### Query Structure

| Anti-Pattern | Impact | Fix |
|--------------|--------|-----|
| SELECT * | High | Specify columns explicitly |
| Correlated subqueries | High | Convert to JOIN or CTE |
| DISTINCT on large datasets | Medium | Use GROUP BY or window functions |
| Non-SARGable predicates | High | Rewrite for index usage |

### Join Issues

| Anti-Pattern | Impact | Fix |
|--------------|--------|-----|
| Cartesian products | Critical | Add join conditions |
| Implicit joins | Medium | Use explicit JOIN syntax |
| Wrong join order | High | Reorder by selectivity |
| Missing indexes on join keys | High | Add clustering/sort keys |

### Aggregation Issues

| Anti-Pattern | Impact | Fix |
|--------------|--------|-----|
| GROUP BY ordinal | Low | Use column names |
| Aggregating before filter | High | Filter first, then aggregate |
| Over-grouping | Medium | Reduce GROUP BY columns |

## Integration Points

### MCP Server Integration

- **Snowflake MCP** - Real-time execution plan analysis
- **BigQuery MCP** - Cost estimation and slot analysis
- **Redshift MCP** - Query execution and statistics

### Related Skills

- Data Quality Profiler (SK-DEA-005) - Table statistics gathering
- dbt Project Analyzer (SK-DEA-003) - Model query optimization

### Applicable Processes

- Query Optimization (`query-optimization.js`)
- Data Warehouse Setup (`data-warehouse-setup.js`)
- BI Dashboard Development (`bi-dashboard.js`)
- OBT Creation (`obt-creation.js`)

## References

- [Snowflake Query Performance](https://docs.snowflake.com/en/user-guide/performance-query)
- [BigQuery Best Practices](https://cloud.google.com/bigquery/docs/best-practices-performance-overview)
- [Redshift Performance Tuning](https://docs.aws.amazon.com/redshift/latest/dg/c_designing-queries-best-practices.html)
- [Databricks SQL Best Practices](https://docs.databricks.com/sql/language-manual/sql-ref-syntax-qry-select.html)

## Version History

- **1.0.0** - Initial release with multi-platform support
