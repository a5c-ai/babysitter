---
name: sklearn-model-trainer
description: Scikit-learn model training skill with cross-validation, hyperparameter tuning, pipeline construction, and model serialization. Enables automated ML model development using scikit-learn's comprehensive toolkit.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# Scikit-learn Model Trainer

Train machine learning models using scikit-learn with cross-validation, hyperparameter tuning, and pipeline construction.

## Overview

This skill provides comprehensive capabilities for training machine learning models using scikit-learn. It supports the full model development workflow from data preprocessing through model training, evaluation, and serialization.

## Capabilities

### Model Training
- Train classification models (LogisticRegression, RandomForest, SVM, etc.)
- Train regression models (LinearRegression, GradientBoosting, etc.)
- Train clustering models (KMeans, DBSCAN, etc.)
- Support for ensemble methods (VotingClassifier, Stacking, etc.)

### Cross-Validation
- K-fold cross-validation
- Stratified K-fold for imbalanced datasets
- Time series split for temporal data
- Leave-one-out and leave-p-out validation
- Custom cross-validation strategies

### Hyperparameter Tuning
- GridSearchCV for exhaustive search
- RandomizedSearchCV for random sampling
- Halving search strategies for efficiency
- Custom scoring functions
- Multi-metric evaluation

### Pipeline Construction
- Feature preprocessing pipelines
- Column transformers for heterogeneous data
- Feature selection integration
- Composite pipelines with caching

### Model Serialization
- Save models with joblib (recommended)
- Pickle serialization
- ONNX export for interoperability
- Model versioning support

## Prerequisites

### Installation
```bash
pip install scikit-learn>=1.0.0 joblib pandas numpy
```

### Optional Dependencies
```bash
# For ONNX export
pip install skl2onnx onnxruntime

# For additional preprocessing
pip install category_encoders imbalanced-learn
```

## Usage Patterns

### Basic Model Training
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import joblib

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42
)
model.fit(X_train, y_train)

# Cross-validation
cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
print(f"CV Accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

# Evaluate
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, 'model.joblib')
```

### Pipeline with Preprocessing
```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier

# Define preprocessing
numeric_features = ['age', 'income', 'score']
categorical_features = ['category', 'region']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# Create full pipeline
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', GradientBoostingClassifier())
])

# Train
pipeline.fit(X_train, y_train)
```

### Hyperparameter Tuning with GridSearchCV
```python
from sklearn.model_selection import GridSearchCV

# Define parameter grid
param_grid = {
    'classifier__n_estimators': [50, 100, 200],
    'classifier__max_depth': [3, 5, 10, None],
    'classifier__learning_rate': [0.01, 0.1, 0.2]
}

# Grid search
grid_search = GridSearchCV(
    pipeline,
    param_grid,
    cv=5,
    scoring='f1_weighted',
    n_jobs=-1,
    verbose=2
)

grid_search.fit(X_train, y_train)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best score: {grid_search.best_score_:.3f}")

# Get best model
best_model = grid_search.best_estimator_
```

### Feature Selection
```python
from sklearn.feature_selection import SelectFromModel, RFE
from sklearn.ensemble import RandomForestClassifier

# Method 1: SelectFromModel
selector = SelectFromModel(
    RandomForestClassifier(n_estimators=100, random_state=42),
    threshold='median'
)
X_selected = selector.fit_transform(X_train, y_train)

# Method 2: Recursive Feature Elimination
rfe = RFE(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    n_features_to_select=10,
    step=1
)
X_rfe = rfe.fit_transform(X_train, y_train)

# Get selected features
selected_features = X.columns[rfe.support_].tolist()
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const sklearnTrainingTask = defineTask({
  name: 'sklearn-model-training',
  description: 'Train a scikit-learn model with cross-validation',

  inputs: {
    modelType: { type: 'string', required: true },
    trainDataPath: { type: 'string', required: true },
    targetColumn: { type: 'string', required: true },
    hyperparameters: { type: 'object', default: {} },
    cvFolds: { type: 'number', default: 5 },
    scoringMetric: { type: 'string', default: 'accuracy' }
  },

  outputs: {
    modelPath: { type: 'string' },
    cvScores: { type: 'array' },
    bestScore: { type: 'number' },
    featureImportances: { type: 'object' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Train ${inputs.modelType} model`,
      skill: {
        name: 'sklearn-model-trainer',
        context: {
          operation: 'train_with_cv',
          modelType: inputs.modelType,
          trainDataPath: inputs.trainDataPath,
          targetColumn: inputs.targetColumn,
          hyperparameters: inputs.hyperparameters,
          cvFolds: inputs.cvFolds,
          scoringMetric: inputs.scoringMetric
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

## Model Selection Guide

### Classification Models

| Model | Use Case | Pros | Cons |
|-------|----------|------|------|
| LogisticRegression | Binary/multiclass, interpretable | Fast, interpretable | Linear boundary |
| RandomForestClassifier | General purpose | Robust, handles nonlinearity | Can overfit |
| GradientBoostingClassifier | High accuracy needed | State-of-art performance | Slower training |
| SVC | Small/medium datasets | Effective in high dimensions | Slow on large data |
| XGBClassifier | Competition/production | Fast, accurate | Many hyperparameters |

### Regression Models

| Model | Use Case | Pros | Cons |
|-------|----------|------|------|
| LinearRegression | Baseline, interpretable | Simple, fast | Assumes linearity |
| Ridge/Lasso | Regularization needed | Prevents overfitting | Still linear |
| RandomForestRegressor | General purpose | Handles nonlinearity | Can overfit |
| GradientBoostingRegressor | High accuracy | Excellent performance | Slower |
| SVR | Small datasets | Robust to outliers | Slow scaling |

## Best Practices

1. **Always Use Pipelines**: Prevent data leakage by including preprocessing in pipelines
2. **Stratified Splits**: Use stratified sampling for imbalanced classification
3. **Cross-Validation**: Never tune hyperparameters on test data
4. **Feature Scaling**: Apply appropriate scaling for distance-based models
5. **Random Seeds**: Set random_state for reproducibility
6. **Model Persistence**: Use joblib over pickle for large numpy arrays

## References

- [Scikit-learn Documentation](https://scikit-learn.org/stable/)
- [Scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Claude Scientific Skills - sklearn](https://github.com/K-Dense-AI/claude-scientific-skills)
- [ML Models as MCP Tools](https://medium.com/@premlaknaboina/how-to-wrap-machine-learning-models-as-mcp-tools-1e510b21f1f9)
