# SQL Query Optimizer

A specialized skill for analyzing and optimizing SQL queries across multiple data warehouse platforms including Snowflake, BigQuery, Redshift, and Databricks.

## Overview

The SQL Query Optimizer examines SQL queries to identify performance bottlenecks, anti-patterns, and optimization opportunities. It provides platform-specific recommendations and generates optimized query versions with detailed explanations.

## Quick Start

```bash
# Basic Snowflake query optimization
/skill sql-query-optimizer --platform snowflake --query "SELECT * FROM orders WHERE date > '2024-01-01'"

# BigQuery with cost optimization focus
/skill sql-query-optimizer --platform bigquery --query "..." --optimizationGoals cost,scan_reduction
```

## Supported Platforms

| Platform | Version | Features |
|----------|---------|----------|
| Snowflake | All | Clustering keys, result cache, query acceleration |
| BigQuery | All | Partitioning, clustering, BI Engine, slot optimization |
| Redshift | All | Sort keys, distribution, compression, vacuum |
| Databricks | SQL/Delta | Z-ordering, Delta cache, Photon, AQE |
| PostgreSQL | 12+ | Indexes, partitioning, parallel queries |

## Features

### 1. Execution Plan Analysis

Parses and analyzes EXPLAIN output to identify:

- Full table scans
- Inefficient join strategies
- Missing indexes/keys
- Spill to disk
- Skewed partitions

### 2. Join Optimization

Identifies and fixes join issues:

```sql
-- Before: Implicit join with Cartesian risk
SELECT o.*, c.name
FROM orders o, customers c
WHERE o.customer_id = c.id

-- After: Explicit join with proper order
SELECT o.order_id, o.amount, c.name
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
```

### 3. Predicate Optimization

Ensures predicates can use indexes:

```sql
-- Before: Non-SARGable (no index usage)
WHERE YEAR(created_at) = 2024

-- After: SARGable (uses index)
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
```

### 4. CTE Optimization

Optimizes Common Table Expressions:

```sql
-- Identifies CTEs that should be materialized
-- Identifies CTEs referenced once (inline them)
-- Suggests CTE ordering for dependencies
```

### 5. Window Function Optimization

Improves window function performance:

```sql
-- Before: Multiple window definitions
SELECT
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY date),
  SUM(amount) OVER (PARTITION BY customer_id ORDER BY date)
FROM orders

-- After: Shared window definition
SELECT
  ROW_NUMBER() OVER w,
  SUM(amount) OVER w
FROM orders
WINDOW w AS (PARTITION BY customer_id ORDER BY date)
```

## Output Report

The optimization generates a detailed report:

```json
{
  "optimizedQuery": "SELECT ...",
  "improvements": [
    {
      "type": "join",
      "description": "Reordered joins by selectivity",
      "impact": "high",
      "originalCode": "FROM large_table JOIN small_table",
      "optimizedCode": "FROM small_table JOIN large_table"
    }
  ],
  "indexRecommendations": [
    {
      "table": "orders",
      "type": "clustering",
      "columns": ["customer_id", "created_at"],
      "ddl": "ALTER TABLE orders CLUSTER BY (customer_id, created_at)"
    }
  ],
  "estimatedImprovement": {
    "scanReduction": 75,
    "timeReduction": 60,
    "costReduction": 70
  },
  "antiPatterns": [
    {
      "pattern": "SELECT *",
      "severity": "high",
      "suggestion": "Specify only needed columns"
    }
  ]
}
```

## Platform-Specific Examples

### Snowflake Optimization

```json
{
  "query": "SELECT * FROM sales WHERE sale_date > '2024-01-01'",
  "platform": "snowflake",
  "tableStatistics": {
    "tables": [{
      "name": "sales",
      "rowCount": 100000000,
      "sizeGB": 200
    }]
  }
}
```

Output recommendations:
- Add clustering key on `sale_date`
- Consider result caching for repeated queries
- Enable query acceleration for variable workloads

### BigQuery Optimization

```json
{
  "query": "SELECT user_id, SUM(revenue) FROM events WHERE event_date = '2024-01-15' GROUP BY user_id",
  "platform": "bigquery",
  "optimizationGoals": ["cost"]
}
```

Output recommendations:
- Use partition pruning with `_PARTITIONDATE`
- Add clustering on `user_id`
- Consider BI Engine for interactive queries

### Redshift Optimization

```json
{
  "query": "SELECT * FROM fact_sales f JOIN dim_product p ON f.product_id = p.id",
  "platform": "redshift"
}
```

Output recommendations:
- Set `product_id` as DISTKEY on both tables
- Add SORTKEY on frequently filtered columns
- Run VACUUM and ANALYZE after bulk loads

## Anti-Pattern Detection

### High Severity

| Pattern | Example | Fix |
|---------|---------|-----|
| Cartesian Product | `FROM a, b` (no WHERE) | Add join condition |
| SELECT * | `SELECT *` | List columns explicitly |
| Function on indexed column | `WHERE UPPER(name) = 'X'` | Use functional index or rewrite |

### Medium Severity

| Pattern | Example | Fix |
|---------|---------|-----|
| OR in WHERE | `WHERE a=1 OR b=2` | Use UNION or IN |
| LIKE with leading wildcard | `WHERE name LIKE '%smith'` | Use full-text search |
| Implicit type conversion | `WHERE id = '123'` | Use correct type |

### Low Severity

| Pattern | Example | Fix |
|---------|---------|-----|
| ORDER BY in subquery | `(SELECT * ORDER BY x)` | Remove or move to outer |
| Redundant DISTINCT | After GROUP BY | Remove DISTINCT |

## Integration

### With MCP Servers

Configure platform-specific MCP servers for enhanced analysis:

```json
{
  "mcpServers": {
    "snowflake": {
      "command": "npx",
      "args": ["@snowflake-labs/mcp"]
    },
    "bigquery": {
      "command": "npx",
      "args": ["mcp-server-bigquery"]
    }
  }
}
```

### With Babysitter Processes

Used by these orchestration processes:

- **query-optimization.js** - Systematic query improvement
- **data-warehouse-setup.js** - Initial warehouse configuration
- **bi-dashboard.js** - Dashboard query optimization

## Best Practices

### Before Submitting Query

1. Include table statistics when available
2. Provide execution plan if performance issues exist
3. Specify optimization goals (latency vs cost)
4. Note any constraints (e.g., cannot modify table structure)

### Interpreting Results

1. Focus on high-impact improvements first
2. Test optimized queries in non-production environment
3. Validate cost estimates with actual execution
4. Consider query frequency when prioritizing optimizations

## Troubleshooting

### Common Issues

**"Unable to parse query"**
- Check SQL syntax for target platform
- Ensure query is complete (not truncated)

**"No optimizations found"**
- Query may already be optimal
- Provide execution plan for deeper analysis
- Add table statistics

**"Platform-specific feature not recognized"**
- Update skill to latest version
- Check platform version compatibility

## References

- [Use The Index, Luke](https://use-the-index-luke.com/)
- [SQL Performance Explained](https://sql-performance-explained.com/)
- Platform documentation (see SKILL.md)

## Version

- **Current Version**: 1.0.0
- **Skill ID**: SK-DEA-004
- **Category**: SQL Optimization
