# MLflow Experiment Tracker Skill

## Overview

The MLflow Experiment Tracker skill provides comprehensive integration with MLflow for machine learning experiment tracking, model registry management, and artifact handling. This skill enables automated logging of experiments, comparison of runs, and management of the ML model lifecycle.

## Purpose

MLflow is the de facto standard for ML experiment tracking in many organizations. This skill bridges the gap between LLM-driven automation and MLflow's capabilities, enabling:

- **Automated Experiment Logging**: Programmatically create experiments and log runs
- **Run Comparison**: Search and compare experiments to identify best performers
- **Model Lifecycle Management**: Register, version, and deploy models through the registry
- **Artifact Retrieval**: Access stored models, datasets, and visualizations

## Use Cases

### 1. Automated Training Pipeline
Log parameters, metrics, and models during automated training runs, ensuring full reproducibility.

### 2. Hyperparameter Search Analysis
Compare results from hyperparameter optimization runs to identify optimal configurations.

### 3. Model Deployment Preparation
Retrieve the best model from experiments and register it for production deployment.

### 4. Experiment Documentation
Generate reports comparing different approaches and their performance metrics.

## Processes That Use This Skill

- **Model Training Pipeline with Experiment Tracking** (`model-training-pipeline.js`)
- **AutoML Pipeline Orchestration** (`automl-pipeline.js`)
- **ML Model Retraining Pipeline** (`model-retraining.js`)
- **Model Deployment Pipeline** (`model-deployment-canary.js`)

## Installation

### MLflow Server Setup

```bash
# Install MLflow
pip install mlflow>=2.0.0

# Start local tracking server
mlflow server --host 0.0.0.0 --port 5000

# Or use managed MLflow (Databricks, AWS SageMaker, etc.)
```

### MCP Server Setup (Optional)

For enhanced LLM integration:

```bash
# Official MLflow MCP (requires MLflow 3.4+)
pip install mlflow>=3.4

# Community MCP server
pip install mlflow-mcp
```

## Configuration

### Environment Variables

```bash
# MLflow tracking URI
export MLFLOW_TRACKING_URI="http://localhost:5000"

# Optional: artifact store
export MLFLOW_ARTIFACT_ROOT="s3://my-bucket/mlflow-artifacts"

# Optional: authentication
export MLFLOW_TRACKING_USERNAME="user"
export MLFLOW_TRACKING_PASSWORD="password"
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "mlflow": {
      "command": "python",
      "args": ["-m", "mlflow_mcp"],
      "env": {
        "MLFLOW_TRACKING_URI": "http://localhost:5000"
      }
    }
  }
}
```

## Capabilities

| Capability | Description | MCP Tool |
|------------|-------------|----------|
| List Experiments | Enumerate all experiments | `mlflow_list_experiments` |
| Create Experiment | Create new experiment | `mlflow_create_experiment` |
| Search Runs | Query runs with filters | `mlflow_search_runs` |
| Get Run Details | Retrieve full run information | `mlflow_get_run` |
| Log Parameters | Record hyperparameters | `mlflow_log_param` |
| Log Metrics | Record training metrics | `mlflow_log_metric` |
| Log Artifacts | Store files and models | `mlflow_log_artifact` |
| List Artifacts | Browse run artifacts | `mlflow_list_artifacts` |
| Register Model | Add model to registry | `mlflow_register_model` |
| Transition Stage | Move model between stages | `mlflow_transition_stage` |

## Example Workflows

### Basic Experiment Tracking

```python
import mlflow

mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("customer-churn-prediction")

with mlflow.start_run(run_name="xgboost-baseline"):
    # Log parameters
    mlflow.log_params({
        "model_type": "xgboost",
        "learning_rate": 0.1,
        "max_depth": 6,
        "n_estimators": 100
    })

    # Train model
    model = train_model(X_train, y_train)

    # Log metrics
    metrics = evaluate_model(model, X_test, y_test)
    mlflow.log_metrics(metrics)

    # Log model
    mlflow.xgboost.log_model(model, "model")
```

### Model Registry Workflow

```python
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register best model
best_run = get_best_run("customer-churn-prediction")
model_uri = f"runs:/{best_run.info.run_id}/model"
mv = mlflow.register_model(model_uri, "churn-predictor")

# Add description
client.update_registered_model(
    "churn-predictor",
    description="XGBoost model for customer churn prediction"
)

# Transition to staging
client.transition_model_version_stage(
    name="churn-predictor",
    version=mv.version,
    stage="Staging"
)
```

## Integration with Other Skills

- **sklearn-model-trainer**: Log scikit-learn models and parameters
- **optuna-hyperparameter-tuner**: Track Optuna study results
- **evidently-drift-detector**: Log drift detection reports as artifacts
- **great-expectations-validator**: Store validation results

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure MLflow server is running and accessible
2. **Permission Denied**: Check authentication credentials
3. **Artifact Store Errors**: Verify artifact storage configuration
4. **Model Registration Failed**: Ensure unique model names

### Debug Commands

```bash
# Test connection
mlflow experiments list

# Check server health
curl http://localhost:5000/health

# View server logs
mlflow server --host 0.0.0.0 --port 5000 --gunicorn-opts "--log-level debug"
```

## References

- [MLflow Documentation](https://mlflow.org/docs/latest/)
- [MLflow Tracking Guide](https://mlflow.org/docs/latest/tracking.html)
- [Model Registry Guide](https://mlflow.org/docs/latest/model-registry.html)
- [MLflow MCP Server (Community)](https://github.com/kkruglik/mlflow-mcp)
- [MLflow GitHub](https://github.com/mlflow/mlflow)
