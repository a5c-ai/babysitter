---
name: mlflow-experiment-tracker
description: MLflow integration skill for experiment tracking, model registry, and artifact management. Enables LLMs to log experiments, compare runs, manage model lifecycle, and retrieve artifacts through the MLflow API.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# MLflow Experiment Tracker

Integrate with MLflow for comprehensive ML experiment tracking, model registry operations, and artifact management.

## Overview

This skill provides capabilities for interacting with MLflow's tracking server and model registry. It enables automated experiment logging, run comparison, model versioning, and artifact retrieval within ML workflows.

## Capabilities

### Experiment Management
- Create and manage experiments
- Start and end runs programmatically
- Set experiment tags and descriptions
- List and search experiments

### Parameter and Metric Logging
- Log hyperparameters for reproducibility
- Track metrics during training (loss, accuracy, etc.)
- Log batch metrics with timestamps
- Set run tags for organization

### Artifact Management
- Log model artifacts (serialized models, checkpoints)
- Store datasets and data samples
- Save plots and visualizations
- Retrieve artifacts from completed runs

### Model Registry Operations
- Register trained models
- Manage model versions
- Transition models between stages (Staging, Production, Archived)
- Add model descriptions and tags

### Run Comparison and Analysis
- Compare metrics across runs
- Search runs by parameters/metrics
- Retrieve best performing runs
- Generate comparison visualizations

## Prerequisites

### MLflow Installation
```bash
pip install mlflow>=2.0.0
```

### MLflow Tracking Server
Configure tracking URI:
```python
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")  # or remote server
```

### Optional: MLflow MCP Server
For enhanced LLM integration, install the MLflow MCP server:
```bash
pip install mlflow>=3.4  # Official MCP support
# or
pip install mlflow-mcp   # Community server
```

## Usage Patterns

### Starting an Experiment Run
```python
import mlflow

# Set experiment
mlflow.set_experiment("my-classification-experiment")

# Start run with context manager
with mlflow.start_run(run_name="baseline-model"):
    # Log parameters
    mlflow.log_param("learning_rate", 0.01)
    mlflow.log_param("batch_size", 32)
    mlflow.log_param("epochs", 100)

    # Log metrics during training
    for epoch in range(100):
        train_loss = train_one_epoch()
        mlflow.log_metric("train_loss", train_loss, step=epoch)

    # Log final metrics
    mlflow.log_metric("accuracy", 0.95)
    mlflow.log_metric("f1_score", 0.93)

    # Log model artifact
    mlflow.sklearn.log_model(model, "model")
```

### Searching and Comparing Runs
```python
import mlflow

# Search runs with filter
runs = mlflow.search_runs(
    experiment_names=["my-classification-experiment"],
    filter_string="metrics.accuracy > 0.9",
    order_by=["metrics.accuracy DESC"],
    max_results=10
)

# Get best run
best_run = runs.iloc[0]
print(f"Best run ID: {best_run.run_id}")
print(f"Best accuracy: {best_run['metrics.accuracy']}")
```

### Model Registry Operations
```python
import mlflow

# Register model from run
model_uri = f"runs:/{run_id}/model"
mlflow.register_model(model_uri, "production-classifier")

# Transition model stage
client = mlflow.tracking.MlflowClient()
client.transition_model_version_stage(
    name="production-classifier",
    version=1,
    stage="Production"
)

# Load production model
model = mlflow.pyfunc.load_model("models:/production-classifier/Production")
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const mlflowTrackingTask = defineTask({
  name: 'mlflow-experiment-tracking',
  description: 'Track ML experiment with MLflow',

  inputs: {
    experimentName: { type: 'string', required: true },
    runName: { type: 'string', required: true },
    parameters: { type: 'object', required: true },
    metrics: { type: 'object', required: true },
    modelPath: { type: 'string' }
  },

  outputs: {
    runId: { type: 'string' },
    experimentId: { type: 'string' },
    artifactUri: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Track experiment: ${inputs.experimentName}/${inputs.runName}`,
      skill: {
        name: 'mlflow-experiment-tracker',
        context: {
          operation: 'log_run',
          experimentName: inputs.experimentName,
          runName: inputs.runName,
          parameters: inputs.parameters,
          metrics: inputs.metrics,
          modelPath: inputs.modelPath
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Integration

### Using mlflow-mcp Server
```json
{
  "mcpServers": {
    "mlflow": {
      "command": "uvx",
      "args": ["mlflow-mcp"],
      "env": {
        "MLFLOW_TRACKING_URI": "http://localhost:5000"
      }
    }
  }
}
```

### Available MCP Tools
- `mlflow_list_experiments` - List all experiments
- `mlflow_search_runs` - Search runs with filters
- `mlflow_get_run` - Get run details
- `mlflow_log_metric` - Log a metric
- `mlflow_log_param` - Log a parameter
- `mlflow_list_artifacts` - List run artifacts
- `mlflow_get_model_version` - Get model version details

## Best Practices

1. **Consistent Naming**: Use descriptive experiment and run names
2. **Complete Logging**: Log all hyperparameters, not just tuned ones
3. **Metric Granularity**: Log metrics at appropriate intervals
4. **Artifact Organization**: Use consistent artifact paths
5. **Model Documentation**: Add descriptions to registered models
6. **Stage Management**: Use proper staging workflow (None -> Staging -> Production)

## References

- [MLflow Documentation](https://mlflow.org/docs/latest/)
- [MLflow MCP Server](https://github.com/kkruglik/mlflow-mcp)
- [Official MLflow MCP (3.4+)](https://mlflow.org/docs/latest/genai/mcp/)
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry.html)
