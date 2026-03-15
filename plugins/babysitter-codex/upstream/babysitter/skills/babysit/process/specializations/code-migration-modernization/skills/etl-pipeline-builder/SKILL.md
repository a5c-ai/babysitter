---
name: etl-pipeline-builder
description: Build and manage ETL pipelines for data migration with transformation, CDC, and monitoring
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# ETL Pipeline Builder Skill

Builds and manages ETL (Extract, Transform, Load) pipelines for data migration, supporting incremental loads, CDC, and comprehensive monitoring.

## Purpose

Enable data pipeline creation for:
- Source-to-target mapping
- Transformation definition
- Incremental load setup
- CDC configuration
- Pipeline monitoring

## Capabilities

### 1. Source-to-Target Mapping
- Define column mappings
- Handle schema differences
- Configure data type conversions
- Manage derived columns

### 2. Transformation Definition
- Data type transformations
- Value mappings
- Aggregations
- Lookups and enrichments

### 3. Incremental Load Setup
- Define watermarks
- Configure incremental columns
- Handle deletes
- Manage merge logic

### 4. CDC Configuration
- Log-based CDC
- Trigger-based CDC
- Timestamp-based CDC
- Full load comparison

### 5. Error Handling
- Define retry policies
- Configure dead letter queues
- Handle data quality issues
- Implement alerting

### 6. Pipeline Monitoring
- Track pipeline metrics
- Monitor data volumes
- Alert on failures
- Generate SLA reports

## Tool Integrations

| Tool | Type | Integration Method |
|------|------|-------------------|
| Apache Airflow | Orchestration | Python |
| dbt | Transformation | CLI |
| Airbyte | Data integration | API |
| Fivetran | SaaS ETL | API |
| AWS DMS | Cloud migration | CLI |
| Debezium | CDC | Config |

## Output Schema

```json
{
  "pipelineId": "string",
  "timestamp": "ISO8601",
  "pipeline": {
    "name": "string",
    "source": {},
    "target": {},
    "mappings": [],
    "transformations": [],
    "schedule": "string"
  },
  "artifacts": {
    "dagFile": "string",
    "configFile": "string",
    "sqlFiles": []
  },
  "deployment": {
    "status": "string",
    "url": "string"
  }
}
```

## Integration with Migration Processes

- **database-schema-migration**: Data movement
- **cloud-migration**: Cloud data pipelines
- **data-format-migration**: Format transformation

## Related Skills

- `data-migration-validator`: Validation
- `schema-comparator`: Schema mapping

## Related Agents

- `database-migration-orchestrator`: Pipeline orchestration
- `data-architect-agent`: Pipeline design
