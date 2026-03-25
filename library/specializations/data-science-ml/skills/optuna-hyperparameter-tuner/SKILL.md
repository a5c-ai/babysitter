---
name: optuna-hyperparameter-tuner
description: Optuna integration skill for automated hyperparameter optimization with advanced search strategies, pruning, multi-objective optimization, and visualization capabilities.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Optuna Hyperparameter Tuner

Optimize hyperparameters using Optuna with advanced search strategies, pruning, and visualization.

## Overview

This skill provides comprehensive capabilities for hyperparameter optimization using Optuna, the state-of-the-art hyperparameter optimization framework. It supports various samplers, pruners, multi-objective optimization, and integration with popular ML frameworks.

## Capabilities

### Search Strategies
- Tree-structured Parzen Estimator (TPE) - default, efficient
- CMA-ES - for continuous parameters
- Grid search - exhaustive
- Random search - baseline
- NSGAII - multi-objective optimization
- QMC (Quasi-Monte Carlo) - low-discrepancy sampling

### Pruning Strategies
- Median pruning - early stop underperformers
- Hyperband (ASHA) - aggressive resource allocation
- Percentile pruning - threshold-based
- Successive Halving - efficient resource use
- Wilcoxon pruning - statistical comparison

### Multi-Objective Optimization
- Pareto front optimization
- Multiple objective functions
- Constraint handling
- Trade-off visualization

### Study Management
- Study persistence (SQLite, PostgreSQL, MySQL)
- Study resumption
- Parallel/distributed optimization
- Trial importance analysis
- Parameter relationship analysis

### Visualization
- Optimization history
- Parameter importance
- Parallel coordinate plots
- Slice plots
- Contour plots

## Prerequisites

### Installation
```bash
pip install optuna>=3.0.0
```

### Optional Dependencies
```bash
# Database backends
pip install optuna[mysql]    # MySQL support
pip install optuna[postgresql]  # PostgreSQL support

# Visualization
pip install optuna-dashboard  # Web dashboard
pip install plotly           # Interactive plots

# Framework integrations
pip install optuna-integration[sklearn]
pip install optuna-integration[pytorch]
pip install optuna-integration[tensorflow]
```

## Usage Patterns

### Basic Optimization
```python
import optuna

def objective(trial):
    # Suggest hyperparameters
    learning_rate = trial.suggest_float('learning_rate', 1e-5, 1e-1, log=True)
    n_estimators = trial.suggest_int('n_estimators', 50, 500)
    max_depth = trial.suggest_int('max_depth', 3, 15)
    subsample = trial.suggest_float('subsample', 0.5, 1.0)

    # Train model
    model = XGBClassifier(
        learning_rate=learning_rate,
        n_estimators=n_estimators,
        max_depth=max_depth,
        subsample=subsample,
        random_state=42
    )

    # Cross-validation
    score = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy').mean()

    return score

# Create study
study = optuna.create_study(
    direction='maximize',
    study_name='xgboost-tuning',
    storage='sqlite:///optuna.db',
    load_if_exists=True
)

# Optimize
study.optimize(objective, n_trials=100, timeout=3600)

# Best results
print(f"Best trial: {study.best_trial.number}")
print(f"Best value: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")
```

### With Pruning
```python
import optuna
from optuna.pruners import MedianPruner

def objective_with_pruning(trial):
    # Suggest hyperparameters
    learning_rate = trial.suggest_float('learning_rate', 1e-5, 1e-1, log=True)
    n_epochs = trial.suggest_int('n_epochs', 10, 100)

    # Create model
    model = create_model(learning_rate)

    # Training loop with pruning
    for epoch in range(n_epochs):
        train_loss = train_one_epoch(model)
        val_accuracy = evaluate(model)

        # Report intermediate value
        trial.report(val_accuracy, epoch)

        # Prune if unpromising
        if trial.should_prune():
            raise optuna.TrialPruned()

    return val_accuracy

# Create study with pruner
study = optuna.create_study(
    direction='maximize',
    pruner=MedianPruner(n_startup_trials=5, n_warmup_steps=10)
)

study.optimize(objective_with_pruning, n_trials=100)
```

### Multi-Objective Optimization
```python
import optuna

def multi_objective(trial):
    # Hyperparameters
    learning_rate = trial.suggest_float('learning_rate', 1e-5, 1e-1, log=True)
    model_size = trial.suggest_categorical('model_size', ['small', 'medium', 'large'])

    # Train model
    model = create_model(learning_rate, model_size)
    train(model)

    # Multiple objectives
    accuracy = evaluate_accuracy(model)
    inference_time = measure_inference_time(model)

    return accuracy, inference_time  # maximize accuracy, minimize time

# Create multi-objective study
study = optuna.create_study(
    directions=['maximize', 'minimize'],
    study_name='pareto-optimization'
)

study.optimize(multi_objective, n_trials=100)

# Get Pareto front
pareto_front = study.best_trials
for trial in pareto_front:
    print(f"Accuracy: {trial.values[0]:.4f}, Time: {trial.values[1]:.4f}")
```

### Scikit-learn Integration
```python
import optuna
from optuna.integration import OptunaSearchCV

# Define parameter distributions
param_distributions = {
    'n_estimators': optuna.distributions.IntDistribution(50, 500),
    'max_depth': optuna.distributions.IntDistribution(3, 15),
    'learning_rate': optuna.distributions.FloatDistribution(1e-5, 1e-1, log=True),
    'subsample': optuna.distributions.FloatDistribution(0.5, 1.0)
}

# Create search
search = OptunaSearchCV(
    XGBClassifier(random_state=42),
    param_distributions,
    n_trials=100,
    cv=5,
    scoring='accuracy',
    study=study,  # Optional: use existing study
    n_jobs=-1
)

# Fit
search.fit(X_train, y_train)

# Results
print(f"Best score: {search.best_score_:.4f}")
print(f"Best params: {search.best_params_}")
```

### PyTorch Integration
```python
import optuna
from optuna.integration import PyTorchLightningPruningCallback

def objective(trial):
    # Hyperparameters
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    hidden_size = trial.suggest_int('hidden_size', 32, 256)
    dropout = trial.suggest_float('dropout', 0.1, 0.5)

    # Create model
    model = LightningModel(
        hidden_size=hidden_size,
        dropout=dropout,
        lr=lr
    )

    # Create trainer with pruning callback
    trainer = pl.Trainer(
        max_epochs=100,
        callbacks=[
            PyTorchLightningPruningCallback(trial, monitor='val_accuracy')
        ]
    )

    trainer.fit(model, train_loader, val_loader)

    return trainer.callback_metrics['val_accuracy'].item()
```

### Distributed Optimization
```python
import optuna

# Create shared study with database storage
study = optuna.create_study(
    study_name='distributed-study',
    storage='postgresql://user:pass@host:5432/optuna',
    direction='maximize',
    load_if_exists=True
)

# Run on multiple workers (each worker runs this)
study.optimize(objective, n_trials=25)  # Each worker does 25 trials

# Results are automatically aggregated
print(f"Total trials: {len(study.trials)}")
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const hyperparameterTuningTask = defineTask({
  name: 'optuna-hyperparameter-tuning',
  description: 'Optimize hyperparameters using Optuna',

  inputs: {
    studyName: { type: 'string', required: true },
    direction: { type: 'string', default: 'maximize' },
    nTrials: { type: 'number', default: 100 },
    timeout: { type: 'number' },
    parameterSpace: { type: 'object', required: true },
    objectiveScript: { type: 'string', required: true },
    sampler: { type: 'string', default: 'tpe' },
    pruner: { type: 'string', default: 'median' }
  },

  outputs: {
    bestValue: { type: 'number' },
    bestParams: { type: 'object' },
    nTrialsCompleted: { type: 'number' },
    studyPath: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Optimize: ${inputs.studyName}`,
      skill: {
        name: 'optuna-hyperparameter-tuner',
        context: {
          operation: 'optimize',
          studyName: inputs.studyName,
          direction: inputs.direction,
          nTrials: inputs.nTrials,
          timeout: inputs.timeout,
          parameterSpace: inputs.parameterSpace,
          objectiveScript: inputs.objectiveScript,
          sampler: inputs.sampler,
          pruner: inputs.pruner
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

### Using optuna-mcp (Official)
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
- `optuna_create_study` - Create new optimization study
- `optuna_get_study` - Retrieve study information
- `optuna_list_studies` - List all studies
- `optuna_get_best_trial` - Get best trial from study
- `optuna_get_trials` - List trials in study
- `optuna_visualize` - Generate visualization
- `optuna_suggest_params` - Get parameter suggestions

## Sampler Selection Guide

| Sampler | Use Case | Pros | Cons |
|---------|----------|------|------|
| `TPESampler` | Default, most cases | Efficient, handles conditionals | May miss global optimum |
| `CmaEsSampler` | Continuous parameters | Good for correlated params | Only continuous |
| `GridSampler` | Small discrete spaces | Exhaustive | Exponential complexity |
| `RandomSampler` | Baseline, parallel | Simple, embarrassingly parallel | Inefficient |
| `NSGAIISampler` | Multi-objective | Pareto optimization | Slower convergence |
| `QMCSampler` | Space exploration | Low discrepancy | Not adaptive |

## Pruner Selection Guide

| Pruner | Use Case | Aggressiveness |
|--------|----------|----------------|
| `MedianPruner` | Default, safe | Moderate |
| `HyperbandPruner` | Deep learning | Aggressive |
| `SuccessiveHalvingPruner` | Resource-efficient | High |
| `PercentilePruner` | Configurable threshold | Variable |
| `NopPruner` | No pruning needed | None |

## Visualization

### Generate Visualizations
```python
import optuna.visualization as vis

# Optimization history
fig = vis.plot_optimization_history(study)
fig.write_html('optimization_history.html')

# Parameter importance
fig = vis.plot_param_importances(study)
fig.write_html('param_importance.html')

# Parallel coordinate
fig = vis.plot_parallel_coordinate(study)
fig.write_html('parallel_coordinate.html')

# Contour plot (2 params)
fig = vis.plot_contour(study, params=['learning_rate', 'max_depth'])
fig.write_html('contour.html')

# Slice plot
fig = vis.plot_slice(study)
fig.write_html('slice.html')
```

### Optuna Dashboard
```bash
# Launch dashboard
optuna-dashboard sqlite:///optuna.db

# Access at http://localhost:8080
```

## Best Practices

1. **Start with TPE**: Use default sampler unless you have specific needs
2. **Use Pruning**: Enable early stopping for iterative algorithms
3. **Persist Studies**: Use database storage for resumability
4. **Log Intermediate Values**: Enable pruning and progress tracking
5. **Set Timeouts**: Prevent runaway optimization
6. **Analyze Importance**: Focus on high-impact parameters
7. **Use Conditional Parameters**: Model dependencies between params

## References

- [Optuna Documentation](https://optuna.readthedocs.io/)
- [Optuna MCP Server](https://github.com/optuna/optuna-mcp)
- [Optuna GitHub](https://github.com/optuna/optuna)
- [Optuna Dashboard](https://github.com/optuna/optuna-dashboard)
- [Optuna Examples](https://github.com/optuna/optuna-examples)
