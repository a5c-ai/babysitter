# Data Lineage Mapper

A comprehensive skill for extracting and mapping data lineage from SQL queries, dbt projects, Airflow DAGs, and Spark jobs, enabling data governance and impact analysis.

## Overview

The Data Lineage Mapper parses various data transformation sources to build comprehensive lineage graphs. It tracks data flow from source to destination at both table and column levels, enabling impact analysis, compliance auditing, and data governance.

## Quick Start

```bash
# Map lineage from SQL
/skill data-lineage-mapper --sources.type sql --sources.content "INSERT INTO target SELECT * FROM source"

# Map lineage from dbt project
/skill data-lineage-mapper --sources.type dbt --sources.content ./target/manifest.json

# Export to DataHub
/skill data-lineage-mapper --sources.type dbt --targetCatalog datahub
```

## Features

### 1. Multi-Source Lineage Extraction

Extract lineage from various sources:

| Source Type | What's Extracted |
|-------------|-----------------|
| SQL | SELECT, INSERT, MERGE statements |
| dbt | Model refs, sources, tests |
| Airflow | Task data flows, XCom |
| Spark | DataFrame operations, SQL |
| Files | CSV/Parquet read/write |

### 2. Column-Level Lineage

Track individual column transformations:

```
Source: customers.first_name + customers.last_name
  |
  | CONCAT transformation
  v
Target: dim_customers.full_name
```

### 3. Impact Analysis

Understand data dependencies:

- **Upstream**: What feeds into this table?
- **Downstream**: What depends on this table?
- **Critical Path**: Most important lineage paths

### 4. Catalog Integration

Export to data catalogs:

- DataHub
- Amundsen
- Alation
- OpenLineage (universal format)

## Output Structure

### Lineage Graph

```json
{
  "lineageGraph": {
    "nodes": [
      {
        "id": "warehouse.raw.customers",
        "type": "table",
        "name": "customers",
        "database": "warehouse",
        "schema": "raw",
        "columns": ["id", "name", "email"]
      },
      {
        "id": "warehouse.analytics.dim_customers",
        "type": "table",
        "name": "dim_customers",
        "database": "warehouse",
        "schema": "analytics"
      }
    ],
    "edges": [
      {
        "source": "warehouse.raw.customers",
        "target": "warehouse.analytics.dim_customers",
        "transformationType": "dbt_model",
        "sql": "SELECT * FROM {{ source('raw', 'customers') }}"
      }
    ]
  }
}
```

### Column Lineage

```json
{
  "columnLineage": [
    {
      "targetColumn": {
        "table": "dim_customers",
        "column": "full_name"
      },
      "sourceColumns": [
        {"table": "raw_customers", "column": "first_name"},
        {"table": "raw_customers", "column": "last_name"}
      ],
      "transformationLogic": "CONCAT(first_name, ' ', last_name)"
    }
  ]
}
```

### Impact Analysis

```json
{
  "impactAnalysis": {
    "target": "raw.customers",
    "upstream": [
      "external_crm.accounts",
      "external_crm.contacts"
    ],
    "downstream": [
      "staging.stg_customers",
      "analytics.dim_customers",
      "analytics.fct_orders",
      "reports.customer_360"
    ],
    "criticalPath": [
      "raw.customers",
      "staging.stg_customers",
      "analytics.dim_customers"
    ]
  }
}
```

## Use Cases

### 1. Schema Change Impact Analysis

Before modifying a source table:

```json
{
  "sources": [{"type": "dbt", "content": "./target/manifest.json"}],
  "options": {
    "impactAnalysisTarget": "raw.customers"
  }
}
```

Output shows all downstream tables and reports affected.

### 2. Compliance Auditing

Track PII data flow:

```json
{
  "sources": [
    {"type": "dbt", "content": "./target/manifest.json"},
    {"type": "sql", "content": "./etl/customer_etl.sql"}
  ],
  "options": {
    "columnLevel": true,
    "trackColumns": ["email", "phone", "ssn"]
  }
}
```

### 3. Data Catalog Population

Export lineage to data catalog:

```json
{
  "sources": [{"type": "dbt", "content": "./target/manifest.json"}],
  "targetCatalog": "datahub",
  "options": {
    "columnLevel": true
  }
}
```

### 4. Cross-System Lineage

Connect lineage across tools:

```json
{
  "sources": [
    {
      "type": "sql",
      "content": "INSERT INTO landing.events SELECT * FROM kafka.events_topic",
      "metadata": {"system": "ingestion"}
    },
    {
      "type": "dbt",
      "content": "./analytics/target/manifest.json",
      "metadata": {"system": "transformation"}
    },
    {
      "type": "sql",
      "content": "./bi/tableau_extracts.sql",
      "metadata": {"system": "reporting"}
    }
  ]
}
```

## SQL Parsing Examples

### SELECT Statement

```sql
SELECT
  c.customer_id,
  c.customer_name,
  SUM(o.amount) as total_orders
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name
```

Extracted lineage:
- `customers.customer_id` -> output.customer_id (direct)
- `customers.customer_name` -> output.customer_name (direct)
- `orders.amount` -> output.total_orders (aggregation: SUM)

### MERGE Statement

```sql
MERGE INTO dim_customers target
USING stg_customers source
ON target.id = source.id
WHEN MATCHED THEN UPDATE SET name = source.name
WHEN NOT MATCHED THEN INSERT (id, name) VALUES (source.id, source.name)
```

Extracted lineage:
- `stg_customers` -> `dim_customers` (merge transformation)
- Column mappings for UPDATE and INSERT

### INSERT...SELECT

```sql
INSERT INTO analytics.fct_orders (order_id, customer_id, amount)
SELECT o.id, c.customer_id, o.order_amount
FROM staging.orders o
JOIN staging.customers c ON o.cust_id = c.id
```

Extracted lineage:
- `staging.orders` -> `analytics.fct_orders`
- `staging.customers` -> `analytics.fct_orders`
- Column: `orders.id` -> `fct_orders.order_id`

## dbt Lineage Extraction

From manifest.json, extracts:

```json
{
  "nodes": {
    "model.analytics.dim_customers": {
      "depends_on": {
        "nodes": [
          "source.analytics.raw.customers",
          "model.analytics.stg_customers"
        ]
      }
    }
  }
}
```

With catalog.json, adds column lineage:

```json
{
  "columns": {
    "full_name": {
      "type": "VARCHAR",
      "description": "Full customer name"
    }
  }
}
```

## Catalog Export Formats

### OpenLineage (Universal)

```json
{
  "eventType": "COMPLETE",
  "eventTime": "2024-01-15T10:00:00Z",
  "run": {"runId": "abc123"},
  "job": {"namespace": "dbt", "name": "dim_customers"},
  "inputs": [
    {"namespace": "raw", "name": "customers"}
  ],
  "outputs": [
    {"namespace": "analytics", "name": "dim_customers"}
  ]
}
```

### DataHub

```json
{
  "entity": "dataset",
  "urn": "urn:li:dataset:(urn:li:dataPlatform:snowflake,analytics.dim_customers,PROD)",
  "aspects": {
    "upstreamLineage": {
      "upstreams": [
        {"dataset": "urn:li:dataset:...raw.customers"}
      ]
    }
  }
}
```

## Integration

### With dbt MCP Server

For real-time manifest access:

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

Used in these orchestration processes:

- **data-lineage.js** - Comprehensive lineage mapping
- **data-catalog.js** - Catalog population
- **dbt-project-setup.js** - Project documentation

## Best Practices

### 1. Maintain Lineage Currency

Run lineage extraction after each deployment:

```bash
dbt build
/skill data-lineage-mapper --sources.type dbt --sources.content ./target/manifest.json
```

### 2. Include All Systems

Map lineage across all data tools:
- Ingestion (Airbyte, Fivetran, custom ETL)
- Transformation (dbt, Spark, SQL)
- Consumption (BI tools, exports)

### 3. Use Column-Level Lineage

Enable for compliance and debugging:

```json
{"options": {"columnLevel": true}}
```

### 4. Export to Catalog

Maintain a centralized lineage view:

```json
{"targetCatalog": "datahub"}
```

## Troubleshooting

### Common Issues

**"Unable to parse SQL"**
- Check SQL dialect compatibility
- Simplify complex expressions
- Verify complete statement

**"Missing column lineage"**
- Ensure catalog.json is present
- Run `dbt docs generate`
- Check column references in SQL

**"Cross-system gaps"**
- Add explicit source metadata
- Map external system identifiers
- Include connection metadata

## References

- [OpenLineage](https://openlineage.io/)
- [DataHub Lineage](https://datahubproject.io/docs/lineage/lineage-feature-guide)
- [dbt Column-Level Lineage](https://docs.getdbt.com/docs/collaborate/column-level-lineage)
- [Marquez](https://marquezproject.ai/)
- [Apache Atlas](https://atlas.apache.org/)

## Version

- **Current Version**: 1.0.0
- **Skill ID**: SK-DEA-010
- **Category**: Data Governance
