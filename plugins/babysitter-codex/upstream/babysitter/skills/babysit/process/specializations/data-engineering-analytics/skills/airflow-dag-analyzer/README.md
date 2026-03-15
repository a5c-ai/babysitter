# Airflow DAG Analyzer

A specialized skill for analyzing, validating, and optimizing Apache Airflow DAG definitions for reliability, performance, and best practices adherence.

## Overview

The Airflow DAG Analyzer examines your DAG Python code and execution history to identify performance bottlenecks, reliability issues, and optimization opportunities. It provides actionable recommendations aligned with Airflow best practices and modern patterns.

## Quick Start

```bash
# Analyze a DAG file
/skill airflow-dag-analyzer --dagCode "$(cat dags/my_dag.py)" --dagId my_dag

# Analyze with execution history
/skill airflow-dag-analyzer --dagCode "..." --executionHistory <metrics.json>
```

## Features

### 1. DAG Structure Validation

Validates DAG definition against best practices:

- Default args configuration
- Schedule interval validity
- Catchup and backfill settings
- Task dependency structure
- Import and module organization

### 2. Task Dependency Analysis

Analyzes the task graph to identify:

- **Critical path** - Longest path determining total runtime
- **Parallelization opportunities** - Tasks that can run concurrently
- **Bottleneck tasks** - Tasks blocking downstream execution
- **Orphan tasks** - Tasks without dependencies (potential errors)

### 3. Sensor Optimization

Evaluates sensor tasks for efficiency:

| Current Pattern | Recommendation | Impact |
|----------------|----------------|--------|
| Poke mode | Use reschedule mode | Frees worker slots |
| No timeout | Add sensor_timeout | Prevents stuck DAGs |
| Old sensors | Use deferrable operators | Async execution |

### 4. Resource Management

Analyzes pool and concurrency configuration:

- Pool slot utilization
- Worker distribution
- Concurrency settings
- Queue assignments

### 5. Reliability Assessment

Checks error handling and alerting:

- Retry configuration
- Timeout settings
- SLA definitions
- Failure callbacks
- Email notifications

## Output Report

### Validation Results

```json
{
  "validationResults": {
    "errors": [
      {
        "code": "DAG-001",
        "message": "Missing default_args",
        "line": 15,
        "severity": "error"
      }
    ],
    "warnings": [
      {
        "code": "SEN-001",
        "message": "FileSensor using poke mode, consider reschedule",
        "line": 42,
        "severity": "warning"
      }
    ]
  }
}
```

### Optimization Recommendations

```json
{
  "optimizations": [
    {
      "category": "parallelization",
      "current": "task1 >> task2 >> task3",
      "recommended": "task1 >> [task2, task3]",
      "impact": "high",
      "effort": "15 minutes",
      "codeChange": "# Tasks 2 and 3 have no dependencies on each other..."
    },
    {
      "category": "sensor",
      "current": "mode='poke', poke_interval=60",
      "recommended": "deferrable=True",
      "impact": "high",
      "effort": "5 minutes"
    }
  ]
}
```

### Dependency Graph

```json
{
  "dependencyGraph": {
    "nodes": ["extract", "transform_a", "transform_b", "load"],
    "edges": [
      ["extract", "transform_a"],
      ["extract", "transform_b"],
      ["transform_a", "load"],
      ["transform_b", "load"]
    ],
    "criticalPath": ["extract", "transform_a", "load"],
    "parallelGroups": [["transform_a", "transform_b"]]
  }
}
```

## Common Issues Detected

### High Severity

| Issue | Impact | Fix |
|-------|--------|-----|
| Hardcoded credentials | Security risk | Use Connections/Variables |
| No retries configured | Silent failures | Add retry settings |
| Unbounded catchup | Resource exhaustion | Set catchup=False |
| Circular dependencies | DAG won't parse | Fix task dependencies |

### Medium Severity

| Issue | Impact | Fix |
|-------|--------|-----|
| Poke mode sensors | Worker blocking | Use reschedule mode |
| No execution timeout | Zombie tasks | Set timeout |
| Sequential tasks | Slow execution | Parallelize |
| No SLA | No alerting | Add SLA |

### Low Severity

| Issue | Impact | Fix |
|-------|--------|-----|
| No task groups | Code organization | Use TaskGroup |
| Static task generation | Maintenance burden | Use dynamic mapping |
| No documentation | Onboarding difficulty | Add doc_md |

## Usage Examples

### Basic Analysis

```python
# Input: Your DAG code
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

dag = DAG(
    'my_etl_dag',
    start_date=datetime(2024, 1, 1),
    schedule_interval='@daily',
)

task1 = PythonOperator(task_id='extract', dag=dag, python_callable=extract)
task2 = PythonOperator(task_id='transform', dag=dag, python_callable=transform)
task3 = PythonOperator(task_id='load', dag=dag, python_callable=load)

task1 >> task2 >> task3
```

Output recommendations:
1. Add default_args with retry configuration
2. Consider adding email_on_failure
3. Set execution_timeout for each task

### Performance Optimization

When provided with execution history:

```json
{
  "executionHistory": {
    "runs": [
      {
        "duration": 7200,
        "taskDurations": {
          "extract": 600,
          "transform_a": 3000,
          "transform_b": 2400,
          "load": 1200
        }
      }
    ]
  }
}
```

Output analysis:
- Critical path: extract -> transform_a -> load (4800s)
- Parallelization: transform_a and transform_b can run in parallel
- Estimated improvement: 40% reduction in total runtime

## Modern Airflow Patterns

### TaskFlow API (Airflow 2.0+)

```python
# Before: Traditional
def extract():
    return data

def transform(data):
    return transformed

extract_task = PythonOperator(task_id='extract', python_callable=extract)
transform_task = PythonOperator(task_id='transform', python_callable=transform)

# After: TaskFlow
@task
def extract():
    return data

@task
def transform(data):
    return transformed

with DAG('my_dag') as dag:
    transform(extract())
```

### Dynamic Task Mapping (Airflow 2.3+)

```python
# Process variable number of items
@task
def get_items():
    return [1, 2, 3, 4, 5]

@task
def process_item(item):
    return item * 2

items = get_items()
processed = process_item.expand(item=items)
```

### Deferrable Operators (Airflow 2.2+)

```python
# Non-blocking sensor
from airflow.sensors.filesystem import FileSensor

FileSensor(
    task_id='wait_for_file',
    filepath='/data/input.csv',
    deferrable=True,  # Releases worker slot
    timeout=3600
)
```

## Integration

### With Airflow MCP Server

```json
{
  "mcpServers": {
    "airflow": {
      "command": "python",
      "args": ["-m", "mcp_server_apache_airflow"],
      "env": {
        "AIRFLOW_HOST": "http://localhost:8080",
        "AIRFLOW_USERNAME": "admin"
      }
    }
  }
}
```

### With Babysitter Processes

Used in these orchestration processes:

- **etl-elt-pipeline.js** - Pipeline development
- **pipeline-migration.js** - DAG migration
- **data-quality-framework.js** - Quality gate DAGs

## Configuration Reference

### Recommended Default Args

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

### Pool Sizing Guidelines

| Task Type | Pool Slots | Rationale |
|-----------|------------|-----------|
| CPU-intensive | 1-2 per CPU | Prevent overload |
| I/O-bound | 4-8 per worker | More parallelism |
| API calls | Rate limit / 2 | Safety margin |
| Sensors | 50+ | Lightweight |

## Troubleshooting

### Common Parsing Errors

**"DAG not found"**
- Check import statements
- Verify DAG variable is at module level
- Look for syntax errors

**"Circular dependency"**
- Review task dependencies
- Use dependency visualization

**"Import timeout"**
- Reduce top-level imports
- Use deferred imports

## References

- [Apache Airflow Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [Astronomer Guides](https://docs.astronomer.io/learn)
- [Airflow TaskFlow API](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html)
- [Deferrable Operators](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/deferring.html)

## Version

- **Current Version**: 1.0.0
- **Skill ID**: SK-DEA-002
- **Category**: Orchestration
