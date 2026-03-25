---
name: data-lineage-mapper
description: Extracts and maps data lineage from various sources including SQL, dbt, Airflow, and Spark, generating comprehensive lineage graphs for impact analysis.
version: 1.0.0
category: Data Governance
skill-id: SK-DEA-010
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# Data Lineage Mapper

Extracts and maps data lineage from various sources to provide comprehensive data flow visibility.

## Overview

This skill parses and extracts data lineage information from SQL queries, dbt projects, Airflow DAGs, and Spark jobs. It generates comprehensive lineage graphs showing data flow from source to destination, enabling impact analysis and data governance.

## Capabilities

- **SQL parsing for lineage extraction** - Parse SELECT, INSERT, MERGE statements
- **dbt lineage integration** - Extract lineage from manifest.json
- **Airflow task lineage mapping** - Map data flows across DAG tasks
- **Spark job lineage extraction** - Parse Spark SQL and DataFrame operations
- **Cross-system lineage connection** - Connect lineage across different tools
- **Column-level lineage tracing** - Track individual column transformations
- **Impact analysis** - Downstream/upstream impact assessment
- **Lineage graph generation** - Visual and machine-readable lineage
- **Integration with data catalogs** - Export to DataHub, Amundsen, Alation

## Input Schema

```json
{
  "sources": {
    "type": "array",
    "required": true,
    "items": {
      "type": {
        "type": "string",
        "enum": ["sql", "dbt", "airflow", "spark", "file"]
      },
      "content": {
        "type": "string|object",
        "description": "SQL string, file path, or manifest object"
      },
      "metadata": {
        "type": "object",
        "properties": {
          "database": "string",
          "schema": "string",
          "catalog": "string"
        }
      }
    }
  },
  "existingLineage": {
    "type": "object",
    "description": "Existing lineage graph to merge with"
  },
  "targetCatalog": {
    "type": "string",
    "enum": ["datahub", "amundsen", "alation", "openlineage", "json"],
    "default": "json",
    "description": "Target format for lineage export"
  },
  "options": {
    "type": "object",
    "properties": {
      "columnLevel": {
        "type": "boolean",
        "default": true,
        "description": "Extract column-level lineage"
      },
      "resolveViews": {
        "type": "boolean",
        "default": false,
        "description": "Resolve views to underlying tables"
      },
      "includeTemporary": {
        "type": "boolean",
        "default": false,
        "description": "Include temporary/CTE tables in lineage"
      }
    }
  }
}
```

## Output Schema

```json
{
  "lineageGraph": {
    "type": "object",
    "properties": {
      "nodes": {
        "type": "array",
        "items": {
          "id": "string",
          "type": "table|view|file|external",
          "name": "string",
          "database": "string",
          "schema": "string",
          "columns": "array"
        }
      },
      "edges": {
        "type": "array",
        "items": {
          "source": "string",
          "target": "string",
          "transformationType": "string",
          "sql": "string"
        }
      }
    }
  },
  "columnLineage": {
    "type": "array",
    "items": {
      "targetColumn": {
        "table": "string",
        "column": "string"
      },
      "sourceColumns": {
        "type": "array",
        "items": {
          "table": "string",
          "column": "string",
          "transformation": "string"
        }
      },
      "transformationLogic": "string"
    }
  },
  "impactAnalysis": {
    "type": "object",
    "properties": {
      "upstream": {
        "type": "array",
        "description": "All upstream dependencies"
      },
      "downstream": {
        "type": "array",
        "description": "All downstream dependents"
      },
      "criticalPath": {
        "type": "array",
        "description": "Most important lineage path"
      }
    }
  },
  "catalogIntegration": {
    "type": "object",
    "description": "Export format for target catalog",
    "properties": {
      "format": "string",
      "payload": "object|string"
    }
  },
  "statistics": {
    "tablesCount": "number",
    "columnsCount": "number",
    "edgesCount": "number",
    "maxDepth": "number"
  }
}
```

## Usage Examples

### SQL Query Lineage

```json
{
  "sources": [
    {
      "type": "sql",
      "content": "INSERT INTO analytics.fct_orders SELECT o.order_id, c.customer_name FROM staging.orders o JOIN staging.customers c ON o.customer_id = c.id",
      "metadata": {
        "database": "warehouse",
        "schema": "analytics"
      }
    }
  ],
  "options": {
    "columnLevel": true
  }
}
```

### dbt Project Lineage

```json
{
  "sources": [
    {
      "type": "dbt",
      "content": "./target/manifest.json"
    }
  ],
  "targetCatalog": "datahub",
  "options": {
    "resolveViews": true
  }
}
```

### Multi-Source Lineage

```json
{
  "sources": [
    {
      "type": "dbt",
      "content": "./analytics/target/manifest.json"
    },
    {
      "type": "airflow",
      "content": "./dags/etl_pipeline.py"
    },
    {
      "type": "sql",
      "content": "SELECT * FROM external_db.customers"
    }
  ],
  "targetCatalog": "openlineage"
}
```

### Impact Analysis for Table Change

```json
{
  "sources": [
    {
      "type": "dbt",
      "content": "./target/manifest.json"
    }
  ],
  "options": {
    "columnLevel": true,
    "impactAnalysisTarget": "raw.customers"
  }
}
```

## Lineage Extraction Methods

### SQL Parsing

| Statement Type | Extracted Information |
|---------------|----------------------|
| SELECT | Source tables, column mappings |
| INSERT INTO...SELECT | Target table, source tables |
| CREATE TABLE AS | New table, source lineage |
| MERGE | Target, source, update/insert columns |
| UPDATE...FROM | Target table, source join tables |

### dbt Manifest

Extracts from `manifest.json`:
- Model dependencies via `ref()` and `source()`
- Column-level lineage from `catalog.json`
- Test dependencies
- Documentation links

### Airflow DAGs

Maps lineage from:
- XCom data passing
- Operator source/destination parameters
- Task dependencies representing data flow
- External task sensors

### Spark Jobs

Parses lineage from:
- Spark SQL queries
- DataFrame operations (join, select, groupBy)
- Read/write operations
- Catalog table references

## Column-Level Lineage

### Transformation Types

| Type | Example | Lineage |
|------|---------|---------|
| Direct | `SELECT customer_id` | 1:1 mapping |
| Rename | `customer_id AS cust_id` | Rename mapping |
| Expression | `CONCAT(first, last) AS name` | Multi-column → single |
| Aggregation | `SUM(amount) AS total` | Many → single with agg |
| Case | `CASE WHEN...` | Conditional mapping |

### Example Output

```json
{
  "columnLineage": [
    {
      "targetColumn": {
        "table": "fct_orders",
        "column": "customer_name"
      },
      "sourceColumns": [
        {
          "table": "stg_customers",
          "column": "first_name",
          "transformation": "CONCAT"
        },
        {
          "table": "stg_customers",
          "column": "last_name",
          "transformation": "CONCAT"
        }
      ],
      "transformationLogic": "CONCAT(first_name, ' ', last_name)"
    }
  ]
}
```

## Catalog Export Formats

### DataHub

```json
{
  "format": "datahub",
  "payload": {
    "entities": [...],
    "relationships": [...]
  }
}
```

### OpenLineage

```json
{
  "format": "openlineage",
  "payload": {
    "eventType": "COMPLETE",
    "run": {...},
    "job": {...},
    "inputs": [...],
    "outputs": [...]
  }
}
```

### Amundsen

```json
{
  "format": "amundsen",
  "payload": {
    "tables": [...],
    "columns": [...],
    "lineage": [...]
  }
}
```

## Integration Points

### MCP Server Integration

- **dbt MCP** - Direct manifest access
- **Database MCPs** - Schema and view resolution
- **MindsDB** - Cross-platform lineage

### Related Skills

- dbt Project Analyzer (SK-DEA-003) - dbt lineage analysis
- Data Catalog Enricher (SK-DEA-017) - Catalog metadata enhancement

### Applicable Processes

- Data Lineage Mapping (`data-lineage.js`)
- Data Catalog (`data-catalog.js`)
- dbt Project Setup (`dbt-project-setup.js`)

## References

- [OpenLineage Specification](https://openlineage.io/)
- [DataHub Lineage](https://datahubproject.io/docs/lineage/lineage-feature-guide)
- [dbt Lineage](https://docs.getdbt.com/docs/collaborate/explore-projects#view-lineage)
- [Apache Atlas Lineage](https://atlas.apache.org/)
- [Marquez](https://marquezproject.ai/)

## Version History

- **1.0.0** - Initial release with multi-source lineage extraction
