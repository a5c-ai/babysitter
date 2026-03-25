# Optuna Hyperparameter Tuner Skill

## Overview

The Optuna Hyperparameter Tuner skill provides comprehensive hyperparameter optimization capabilities using Optuna, the leading open-source hyperparameter optimization framework. This skill enables efficient search for optimal model configurations with advanced features like pruning, multi-objective optimization, and distributed training.

## Purpose

Hyperparameter tuning is critical for achieving optimal model performance. Optuna provides state-of-the-art optimization algorithms that efficiently explore the search space. This skill enables:

- **Efficient Search**: Use advanced samplers like TPE for intelligent exploration
- **Early Stopping**: Prune unpromising trials to save compute resources
- **Multi-Objective**: Optimize for multiple metrics simultaneously
- **Scalability**: Distribute optimization across multiple workers

## Use Cases

### 1. Model Training Optimization
Find optimal hyperparameters for any ML model during training.

### 2. Neural Architecture Search
Optimize network architecture parameters (layers, neurons, etc.).

### 3. Feature Selection
Optimize feature selection thresholds and parameters.

### 4. Ensemble Configuration
Find optimal weights and configurations for model ensembles.

## Processes That Use This Skill

- **Model Training Pipeline with Experiment Tracking** (`model-training-pipeline.js`)
- **AutoML Pipeline Orchestration** (`automl-pipeline.js`)
- **Experiment Planning and Hypothesis Testing** (`experiment-planning.js`)
- **Distributed Training Orchestration** (`distributed-training.js`)

## Installation

```bash
# Core installation
pip install optuna>=3.0.0

# Optional: Dashboard
pip install optuna-dashboard

# Optional: Database backends
pip install optuna[mysql]
pip install optuna[postgresql]

# Optional: Framework integrations
pip install optuna-integration[sklearn,pytorch,tensorflow]
```

## Quick Start

### 1. Define Objective Function

```python
import optuna
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

def objective(trial):
    # Define search space
    n_estimators = trial.suggest_int('n_estimators', 10, 200)
    max_depth = trial.suggest_int('max_depth', 2, 32)
    min_samples_split = trial.suggest_int('min_samples_split', 2, 20)

    # Create and evaluate model
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        random_state=42
    )

    score = cross_val_score(clf, X, y, cv=5, scoring='accuracy').mean()
    return score
```

### 2. Create and Run Study

```python
# Create study
study = optuna.create_study(
    direction='maximize',
    study_name='random-forest-tuning'
)

# Run optimization
study.optimize(objective, n_trials=100)

# Get results
print(f"Best value: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")
```

### 3. Visualize Results

```python
import optuna.visualization as vis

# Optimization history
vis.plot_optimization_history(study).show()

# Parameter importance
vis.plot_param_importances(study).show()

# Parameter relationships
vis.plot_parallel_coordinate(study).show()
```

## Search Space Definition

### Parameter Types

| Method | Type | Example |
|--------|------|---------|
| `suggest_int` | Integer | `trial.suggest_int('n_layers', 1, 5)` |
| `suggest_float` | Float | `trial.suggest_float('lr', 1e-5, 1e-1)` |
| `suggest_categorical` | Categorical | `trial.suggest_categorical('optimizer', ['adam', 'sgd'])` |
| `suggest_discrete_uniform` | Discrete float | `trial.suggest_discrete_uniform('dropout', 0.1, 0.5, 0.1)` |

### Log Scale for Learning Rates

```python
# Log scale for parameters spanning orders of magnitude
learning_rate = trial.suggest_float('learning_rate', 1e-5, 1e-1, log=True)
```

### Conditional Parameters

```python
def objective(trial):
    # Suggest optimizer type
    optimizer = trial.suggest_categorical('optimizer', ['adam', 'sgd'])

    # Conditional parameters based on optimizer
    if optimizer == 'adam':
        beta1 = trial.suggest_float('adam_beta1', 0.8, 0.99)
        beta2 = trial.suggest_float('adam_beta2', 0.9, 0.999)
    else:
        momentum = trial.suggest_float('sgd_momentum', 0.0, 0.99)
        nesterov = trial.suggest_categorical('sgd_nesterov', [True, False])
```

## Samplers

### TPE (Default)

```python
from optuna.samplers import TPESampler

study = optuna.create_study(
    sampler=TPESampler(
        n_startup_trials=10,  # Random trials before TPE
        seed=42
    )
)
```

### CMA-ES (Continuous)

```python
from optuna.samplers import CmaEsSampler

study = optuna.create_study(
    sampler=CmaEsSampler()
)
```

### Grid Search

```python
from optuna.samplers import GridSampler

search_space = {
    'n_estimators': [50, 100, 200],
    'max_depth': [3, 5, 10]
}

study = optuna.create_study(
    sampler=GridSampler(search_space)
)
```

## Pruning

### Median Pruner

```python
from optuna.pruners import MedianPruner

study = optuna.create_study(
    pruner=MedianPruner(
        n_startup_trials=5,    # Minimum trials before pruning
        n_warmup_steps=10,     # Steps before pruning in each trial
        interval_steps=1       # Check every N steps
    )
)
```

### Hyperband (ASHA)

```python
from optuna.pruners import HyperbandPruner

study = optuna.create_study(
    pruner=HyperbandPruner(
        min_resource=1,
        max_resource=100,
        reduction_factor=3
    )
)
```

### Using Pruning in Objective

```python
def objective(trial):
    model = create_model(trial)

    for epoch in range(100):
        train(model)
        accuracy = evaluate(model)

        # Report intermediate value
        trial.report(accuracy, epoch)

        # Check if trial should be pruned
        if trial.should_prune():
            raise optuna.TrialPruned()

    return accuracy
```

## MCP Server Integration

Optuna provides an official MCP server for LLM integration:

```json
{
  "mcpServers": {
    "optuna": {
      "command": "uvx",
      "args": ["optuna-mcp"],
      "env": {
        "OPTUNA_STORAGE": "sqlite:///optuna.db"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `optuna_create_study` | Create new study |
| `optuna_list_studies` | List all studies |
| `optuna_get_study` | Get study details |
| `optuna_get_best_trial` | Get best performing trial |
| `optuna_get_trials` | List trials in study |
| `optuna_suggest_params` | Get parameter suggestions |
| `optuna_visualize` | Generate visualizations |

## Multi-Objective Optimization

```python
def multi_objective(trial):
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    n_layers = trial.suggest_int('n_layers', 1, 5)

    model = create_model(lr, n_layers)
    train(model)

    accuracy = evaluate_accuracy(model)
    latency = measure_latency(model)

    return accuracy, latency

study = optuna.create_study(
    directions=['maximize', 'minimize']  # accuracy, latency
)

study.optimize(multi_objective, n_trials=100)

# Pareto optimal solutions
for trial in study.best_trials:
    print(f"Accuracy: {trial.values[0]:.4f}, Latency: {trial.values[1]:.4f}ms")
```

## Distributed Optimization

```python
# Use database storage for coordination
storage = 'postgresql://user:pass@host:5432/optuna'

# Worker 1
study = optuna.create_study(
    study_name='distributed-study',
    storage=storage,
    load_if_exists=True
)
study.optimize(objective, n_trials=50)

# Worker 2 (same code, runs in parallel)
study = optuna.create_study(
    study_name='distributed-study',
    storage=storage,
    load_if_exists=True
)
study.optimize(objective, n_trials=50)

# Results automatically aggregated
```

## Framework Integrations

### Scikit-learn

```python
from optuna.integration import OptunaSearchCV

search = OptunaSearchCV(
    RandomForestClassifier(),
    {
        'n_estimators': optuna.distributions.IntDistribution(50, 200),
        'max_depth': optuna.distributions.IntDistribution(3, 15)
    },
    n_trials=100,
    cv=5
)
search.fit(X, y)
```

### PyTorch Lightning

```python
from optuna.integration import PyTorchLightningPruningCallback

callback = PyTorchLightningPruningCallback(trial, monitor='val_loss')
trainer = pl.Trainer(callbacks=[callback])
```

### XGBoost

```python
from optuna.integration import XGBoostPruningCallback

callback = XGBoostPruningCallback(trial, 'validation-logloss')
model = xgb.train(
    params,
    dtrain,
    callbacks=[callback],
    evals=[(dval, 'validation')]
)
```

## Best Practices

### 1. Persist Studies

```python
# Always use storage for resumability
study = optuna.create_study(
    storage='sqlite:///optuna.db',
    study_name='my-study',
    load_if_exists=True
)
```

### 2. Set Appropriate Timeouts

```python
# Limit total optimization time
study.optimize(objective, n_trials=1000, timeout=3600)  # 1 hour max
```

### 3. Log User Attributes

```python
def objective(trial):
    # Log additional information
    trial.set_user_attr('model_version', '1.0.0')
    trial.set_user_attr('dataset', 'train_v2')
    # ...
```

### 4. Handle Failed Trials

```python
def objective(trial):
    try:
        # ... optimization code ...
    except Exception as e:
        # Log error and return worst value
        trial.set_user_attr('error', str(e))
        return float('-inf')  # For maximization
```

## Troubleshooting

### Common Issues

1. **Slow Optimization**: Use pruning, reduce n_trials
2. **Memory Issues**: Use database storage, not in-memory
3. **Poor Results**: Increase n_trials, adjust search space
4. **Deadlock in Distributed**: Check database connections

### Debug Tips

```python
# Enable verbose logging
optuna.logging.set_verbosity(optuna.logging.DEBUG)

# Check study statistics
print(f"Completed: {len(study.get_trials(states=[optuna.trial.TrialState.COMPLETE]))}")
print(f"Pruned: {len(study.get_trials(states=[optuna.trial.TrialState.PRUNED]))}")
print(f"Failed: {len(study.get_trials(states=[optuna.trial.TrialState.FAIL]))}")
```

## Integration with Other Skills

- **mlflow-experiment-tracker**: Log Optuna trials to MLflow
- **sklearn-model-trainer**: Optimize scikit-learn models
- **evidently-drift-detector**: Optimize drift detection thresholds
- **great-expectations-validator**: Validate training data

## References

- [Optuna Documentation](https://optuna.readthedocs.io/)
- [Optuna MCP Server](https://github.com/optuna/optuna-mcp)
- [Optuna GitHub](https://github.com/optuna/optuna)
- [Optuna Dashboard](https://github.com/optuna/optuna-dashboard)
- [Optuna Examples](https://github.com/optuna/optuna-examples)
