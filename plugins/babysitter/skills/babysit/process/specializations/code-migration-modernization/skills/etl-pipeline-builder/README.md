# ETL Pipeline Builder Skill

## Overview

The ETL Pipeline Builder skill creates data migration pipelines. It handles extraction, transformation, and loading with support for incremental updates and CDC.

## Quick Start

### Prerequisites

- Pipeline tool (Airflow, dbt, etc.)
- Source/target access
- Transformation requirements

### Basic Usage

1. **Define mappings**
   - Map source to target columns
   - Define transformations
   - Configure data types

2. **Build pipeline**
   - Create extraction logic
   - Implement transformations
   - Configure loading

3. **Deploy and monitor**
   - Deploy to orchestrator
   - Set up monitoring
   - Configure alerts

## Features

### Pipeline Types

| Type | Use Case | Latency |
|------|----------|---------|
| Batch | Historical data | Hours |
| Micro-batch | Near real-time | Minutes |
| Streaming | Real-time | Seconds |
| CDC | Change capture | Varies |

### Components

- Source connectors
- Transformation logic
- Target loaders
- Monitoring dashboards

## Configuration

```json
{
  "pipeline": {
    "name": "customer-migration",
    "schedule": "0 2 * * *",
    "type": "incremental"
  },
  "source": {
    "type": "postgresql",
    "table": "customers"
  },
  "target": {
    "type": "snowflake",
    "table": "customers"
  },
  "incremental": {
    "column": "updated_at",
    "method": "timestamp"
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Apache Airflow](https://airflow.apache.org/)
- [dbt](https://getdbt.com/)
