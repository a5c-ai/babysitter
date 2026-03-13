---
name: airflow-dag-analyzer
description: Analyzes, validates, and optimizes Apache Airflow DAGs for reliability, performance, and best practices adherence.
version: 1.0.0
category: Orchestration
skill-id: SK-DEA-002
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# Airflow DAG Analyzer

Analyzes, validates, and optimizes Apache Airflow DAGs for reliability and performance.

## Overview

This skill examines Apache Airflow DAG definitions to identify performance bottlenecks, reliability issues, and best practice violations. It provides recommendations for task dependency optimization, parallelism configuration, error handling, and resource management.

## Capabilities

- **DAG structure analysis and validation** - Parse and validate DAG structure
- **Task dependency optimization** - Identify bottlenecks and suggest parallel execution
- **Parallelism and concurrency recommendations** - Optimize pool and slot allocation
- **SLA and timeout configuration** - Recommend appropriate timeouts and SLAs
- **Retry and failure handling patterns** - Validate retry logic and alerting
- **Sensor optimization** - Smart sensors, deferrable operators, reschedule mode
- **Resource pool allocation** - Optimize pool usage and worker distribution
- **DAG scheduling optimization** - Catchup, backfill, and schedule interval tuning
- **Cross-DAG dependency detection** - Identify external dependencies and triggers

## Input Schema

```json
{
  "dagCode": {
    "type": "string",
    "description": "The Python DAG definition code",
    "required": true
  },
  "dagId": {
    "type": "string",
    "description": "The DAG identifier"
  },
  "executionHistory": {
    "type": "object",
    "description": "Historical execution metrics",
    "properties": {
      "runs": {
        "type": "array",
        "items": {
          "dagRunId": "string",
          "executionDate": "string",
          "duration": "number",
          "state": "string",
          "taskDurations": "object"
        }
      }
    }
  },
  "clusterConfig": {
    "type": "object",
    "properties": {
      "workerCount": "number",
      "executorType": "string",
      "poolConfigs": "object",
      "airflowVersion": "string"
    }
  },
  "analysisScope": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["structure", "performance", "reliability", "resources", "security"]
    },
    "default": ["structure", "performance", "reliability"]
  }
}
```

## Output Schema

```json
{
  "validationResults": {
    "errors": {
      "type": "array",
      "items": {
        "code": "string",
        "message": "string",
        "line": "number",
        "severity": "error"
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "code": "string",
        "message": "string",
        "line": "number",
        "severity": "warning"
      }
    }
  },
  "optimizations": {
    "type": "array",
    "items": {
      "category": "string",
      "current": "string",
      "recommended": "string",
      "impact": "high|medium|low",
      "effort": "string",
      "codeChange": "string"
    }
  },
  "recommendedConfig": {
    "type": "object",
    "properties": {
      "poolSize": "number",
      "maxActiveRuns": "number",
      "concurrency": "number",
      "defaultRetries": "number",
      "executionTimeout": "string"
    }
  },
  "dependencyGraph": {
    "type": "object",
    "properties": {
      "nodes": "array",
      "edges": "array",
      "criticalPath": "array",
      "parallelGroups": "array"
    }
  },
  "metrics": {
    "taskCount": "number",
    "maxDepth": "number",
    "parallelizationRatio": "number",
    "estimatedDuration": "string"
  },
  "securityFindings": {
    "type": "array",
    "items": {
      "severity": "high|medium|low",
      "finding": "string",
      "recommendation": "string"
    }
  }
}
```

## Usage Examples

### Basic DAG Analysis

```json
{
  "dagCode": "from airflow import DAG\nfrom airflow.operators.python import PythonOperator\n...",
  "dagId": "daily_etl_pipeline"
}
```

### With Execution History

```json
{
  "dagCode": "...",
  "dagId": "daily_etl_pipeline",
  "executionHistory": {
    "runs": [
      {
        "dagRunId": "manual__2024-01-15",
        "duration": 3600,
        "state": "success",
        "taskDurations": {
          "extract": 600,
          "transform": 1800,
          "load": 1200
        }
      }
    ]
  }
}
```

### Full Analysis with Cluster Config

```json
{
  "dagCode": "...",
  "dagId": "complex_ml_pipeline",
  "clusterConfig": {
    "workerCount": 8,
    "executorType": "KubernetesExecutor",
    "poolConfigs": {
      "default_pool": {"slots": 128},
      "ml_pool": {"slots": 32}
    },
    "airflowVersion": "2.8.0"
  },
  "analysisScope": ["structure", "performance", "reliability", "resources", "security"]
}
```

## Validation Rules

### DAG Definition Rules

| Rule | Severity | Description |
|------|----------|-------------|
| DAG-001 | Error | Missing DAG default_args |
| DAG-002 | Error | Invalid schedule_interval |
| DAG-003 | Warning | Catchup enabled for long-running DAG |
| DAG-004 | Warning | No email on failure configured |
| DAG-005 | Info | Consider using @dag decorator |

### Task Definition Rules

| Rule | Severity | Description |
|------|----------|-------------|
| TSK-001 | Error | Task has no upstream or downstream |
| TSK-002 | Warning | Task missing retries configuration |
| TSK-003 | Warning | Execution timeout not set |
| TSK-004 | Warning | PythonOperator with no pool |
| TSK-005 | Info | Consider TaskGroup for related tasks |

### Sensor Rules

| Rule | Severity | Description |
|------|----------|-------------|
| SEN-001 | Warning | Sensor in poke mode (use reschedule) |
| SEN-002 | Warning | Sensor missing timeout |
| SEN-003 | Info | Consider deferrable operator |
| SEN-004 | Warning | External sensor without soft_fail |

### Security Rules

| Rule | Severity | Description |
|------|----------|-------------|
| SEC-001 | Error | Hardcoded credentials |
| SEC-002 | Warning | Using Variable.get without default |
| SEC-003 | Warning | Connection ID not parameterized |
| SEC-004 | Info | Consider Secrets Backend |

## Optimization Patterns

### Parallelization

```python
# Before: Sequential execution
task1 >> task2 >> task3 >> task4

# After: Parallel execution where possible
task1 >> [task2, task3] >> task4
```

### Sensor Optimization

```python
# Before: Poke mode (blocks worker)
FileSensor(
    task_id='wait_for_file',
    filepath='/data/input.csv',
    mode='poke'  # Bad
)

# After: Reschedule mode (releases worker)
FileSensor(
    task_id='wait_for_file',
    filepath='/data/input.csv',
    mode='reschedule',  # Good
    poke_interval=300
)

# Best: Deferrable (Airflow 2.2+)
from airflow.sensors.filesystem import FileSensor
FileSensor(
    task_id='wait_for_file',
    filepath='/data/input.csv',
    deferrable=True
)
```

### TaskGroups

```python
# Before: Flat task structure
extract_orders >> transform_orders >> load_orders
extract_products >> transform_products >> load_products

# After: TaskGroups for organization
with TaskGroup('orders') as orders_group:
    extract >> transform >> load

with TaskGroup('products') as products_group:
    extract >> transform >> load
```

### Dynamic Task Mapping (Airflow 2.3+)

```python
# Before: Static task generation
for i in range(10):
    PythonOperator(task_id=f'process_{i}', ...)

# After: Dynamic task mapping
@task
def process_item(item):
    return item * 2

process_item.expand(item=[1, 2, 3, 4, 5])
```

## Configuration Recommendations

### Default Args Template

```python
default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'email': ['alerts@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30),
    'execution_timeout': timedelta(hours=2),
    'sla': timedelta(hours=1),
}
```

### Pool Configuration

| Workload Type | Recommended Pool Size |
|---------------|----------------------|
| Heavy compute | 2-4 per worker |
| I/O bound | 8-16 per worker |
| API calls | Rate limit based |
| Sensors | Separate pool, high slots |

## Integration Points

### MCP Server Integration

- **yangkyeongmo/mcp-server-apache-airflow** - Airflow REST API integration
- **Dagster MCP** - Alternative orchestration patterns
- **Prefect MCP** - Modern orchestration comparison

### Related Skills

- dbt Project Analyzer (SK-DEA-003) - dbt operator optimization
- Data Lineage Mapper (SK-DEA-010) - Task lineage extraction

### Applicable Processes

- ETL/ELT Pipeline (`etl-elt-pipeline.js`)
- A/B Testing Pipeline (`ab-testing-pipeline.js`)
- Pipeline Migration (`pipeline-migration.js`)
- Data Quality Framework (`data-quality-framework.js`)

## References

- [Airflow Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [Airflow DAG Writing Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/howto/dag-best-practices.html)
- [Astronomer Guides](https://docs.astronomer.io/learn)
- [Airflow MCP Server](https://github.com/yangkyeongmo/mcp-server-apache-airflow)

## Version History

- **1.0.0** - Initial release with Airflow 2.x support
