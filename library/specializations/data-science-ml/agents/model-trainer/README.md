# Model Trainer Agent

## Overview

The Model Trainer agent is an autonomous ML agent specialized in training machine learning models. It orchestrates the complete training lifecycle from data preparation through hyperparameter optimization to experiment logging, producing production-ready trained models.

## Purpose

Training ML models requires coordinating multiple activities: data preprocessing, model configuration, hyperparameter tuning, cross-validation, and experiment tracking. This agent automates these tasks with intelligent decision-making based on the problem type and data characteristics.

## Capabilities

| Capability | Description |
|------------|-------------|
| Model Training | Train various ML models (sklearn, XGBoost, etc.) |
| Hyperparameter Tuning | Optimize parameters using Optuna |
| Cross-Validation | Implement proper validation strategies |
| Experiment Tracking | Log runs to MLflow |
| Pipeline Construction | Build preprocessing + model pipelines |
| Checkpoint Management | Save and resume training |

## Required Skills

This agent requires the following skills to function:

1. **sklearn-model-trainer**: Core model training capabilities
2. **mlflow-experiment-tracker**: Experiment logging and tracking
3. **optuna-hyperparameter-tuner**: Hyperparameter optimization

## Processes That Use This Agent

- **Model Training Pipeline** (`model-training-pipeline.js`)
- **AutoML Pipeline Orchestration** (`automl-pipeline.js`)
- **ML Model Retraining Pipeline** (`model-retraining.js`)

## Workflow

### Phase 1: Data Preparation

```
Input: Raw training data
Output: Preprocessed train/validation splits

Steps:
1. Load data from specified path
2. Identify feature types (numerical, categorical, text)
3. Handle missing values
4. Create train/validation/test splits
5. Fit preprocessing transformers on training data only
```

### Phase 2: Model Configuration

```
Input: Task requirements, data characteristics
Output: Configured model pipeline

Steps:
1. Select appropriate algorithm based on task type
2. Configure default hyperparameters
3. Build preprocessing + model pipeline
4. Set up cross-validation strategy
```

### Phase 3: Hyperparameter Optimization

```
Input: Model pipeline, search configuration
Output: Best hyperparameters

Steps:
1. Define parameter search space
2. Configure Optuna sampler and pruner
3. Run optimization trials
4. Analyze parameter importance
5. Select best configuration
```

### Phase 4: Final Training

```
Input: Best hyperparameters, full training data
Output: Trained model, metrics

Steps:
1. Retrain model with best parameters on full training data
2. Evaluate on held-out test set
3. Generate feature importance rankings
4. Create model artifacts
```

### Phase 5: Experiment Logging

```
Input: Model, metrics, parameters
Output: Logged experiment

Steps:
1. Log hyperparameters to MLflow
2. Record all evaluation metrics
3. Store model artifacts
4. Register model in registry (optional)
```

## Input Specification

```json
{
  "task": "train_model",
  "modelType": "classification",
  "algorithm": "random_forest",
  "trainDataPath": "/data/train.csv",
  "targetColumn": "target",
  "features": ["age", "income", "category"],
  "validationStrategy": {
    "type": "stratified_kfold",
    "folds": 5,
    "shuffle": true
  },
  "hyperparameterSearch": {
    "enabled": true,
    "nTrials": 100,
    "timeout": 3600,
    "sampler": "tpe",
    "pruner": "median"
  },
  "experimentTracking": {
    "enabled": true,
    "experimentName": "customer-churn",
    "trackingUri": "http://localhost:5000"
  },
  "options": {
    "earlyStoppingRounds": 10,
    "verbosity": 1
  }
}
```

## Output Specification

```json
{
  "success": true,
  "modelPath": "/artifacts/model.joblib",
  "metrics": {
    "test": {
      "accuracy": 0.95,
      "precision": 0.94,
      "recall": 0.93,
      "f1": 0.935,
      "roc_auc": 0.98
    },
    "crossValidation": {
      "accuracy_mean": 0.94,
      "accuracy_std": 0.02
    }
  },
  "bestParams": {
    "n_estimators": 200,
    "max_depth": 10,
    "min_samples_split": 5,
    "min_samples_leaf": 2
  },
  "featureImportance": {
    "income": 0.35,
    "age": 0.28,
    "category": 0.22
  },
  "experiment": {
    "runId": "abc123def456",
    "experimentId": "1",
    "trackingUri": "http://localhost:5000"
  },
  "metadata": {
    "trainingTime": 1234.5,
    "nTrials": 100,
    "bestTrialNumber": 87
  },
  "artifacts": [
    "/artifacts/model.joblib",
    "/artifacts/feature_importance.json",
    "/artifacts/training_history.json",
    "/artifacts/confusion_matrix.png"
  ]
}
```

## Decision Logic

### Algorithm Selection

The agent selects algorithms based on:

| Task Type | Data Size | Recommended |
|-----------|-----------|-------------|
| Classification | Small (<10k) | RandomForest, SVM |
| Classification | Medium (10k-100k) | XGBoost, LightGBM |
| Classification | Large (>100k) | Neural Network |
| Regression | Linear relationships | Ridge, Lasso |
| Regression | Non-linear | GradientBoosting, XGBoost |
| Time Series | Sequential | ARIMA, Prophet, LSTM |

### Hyperparameter Strategy

| Scenario | Strategy |
|----------|----------|
| Quick baseline | Random search, 20 trials |
| Production model | TPE sampler, 100+ trials |
| Large model | TPE with pruning |
| Multi-objective | NSGA-II |

### Validation Strategy

| Data Type | Strategy |
|-----------|----------|
| IID classification | StratifiedKFold |
| IID regression | KFold |
| Time series | TimeSeriesSplit |
| Small dataset | RepeatedStratifiedKFold |
| Class imbalance | StratifiedKFold + class weights |

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `MemoryError` | Dataset too large | Use batch loading, reduce features |
| `ConvergenceWarning` | Model not converging | Adjust learning rate, more iterations |
| `ValueError: NaN` | Invalid data | Check preprocessing, handle missing values |
| `ModuleNotFoundError` | Missing dependency | Install required packages |

### Recovery Strategy

```
1. Log error details to experiment tracker
2. Save partial results (if any)
3. Analyze root cause
4. Attempt automatic remediation if possible
5. Report failure with actionable suggestions
```

## Integration

### With Other Agents

```
eda-analyst ──> model-trainer ──> model-evaluator ──> deployment-engineer
    │                                   │
    └── feature recommendations         └── evaluation feedback
```

### With Skills

```
model-trainer
    ├── sklearn-model-trainer (training)
    ├── mlflow-experiment-tracker (logging)
    └── optuna-hyperparameter-tuner (optimization)
```

## Usage Example

### In Babysitter Process

```javascript
// model-training-pipeline.js

const trainingResult = await ctx.task(modelTrainingTask, {
  modelType: 'classification',
  algorithm: 'xgboost',
  trainDataPath: '/data/features.parquet',
  targetColumn: 'churn',
  hyperparameterSearch: {
    enabled: true,
    nTrials: 100
  },
  experimentTracking: {
    experimentName: 'churn-prediction-v2'
  }
});

// Check results
if (trainingResult.metrics.test.roc_auc >= 0.85) {
  ctx.log('info', 'Model meets performance threshold');
  // Proceed to deployment
} else {
  ctx.log('warn', 'Model below threshold, needs iteration');
  // Trigger improvement cycle
}
```

### Direct Agent Call

```javascript
const task = defineTask({
  name: 'train-churn-model',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Train customer churn model',
      agent: {
        name: 'model-trainer',
        prompt: {
          role: 'Senior ML Engineer',
          task: 'Train a classification model to predict customer churn',
          context: {
            dataPath: '/data/customers.csv',
            target: 'churned',
            businessRequirement: 'Minimize false negatives (missed churns)'
          },
          instructions: [
            'Load and explore the customer data',
            'Handle class imbalance appropriately',
            'Optimize for recall while maintaining reasonable precision',
            'Use cross-validation with at least 5 folds',
            'Track experiment in MLflow',
            'Return trained model with full metrics'
          ]
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

## Best Practices

1. **Always validate data quality** before training
2. **Use pipelines** to prevent data leakage
3. **Log everything** to experiment tracker
4. **Cross-validate** properly based on data type
5. **Save checkpoints** for long training runs
6. **Document decisions** in experiment notes

## Related Resources

- Skills: `sklearn-model-trainer/SKILL.md`
- Skills: `mlflow-experiment-tracker/SKILL.md`
- Skills: `optuna-hyperparameter-tuner/SKILL.md`
- Process: `model-training-pipeline.js`
