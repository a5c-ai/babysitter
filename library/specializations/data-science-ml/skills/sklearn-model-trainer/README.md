# Scikit-learn Model Trainer Skill

## Overview

The Scikit-learn Model Trainer skill provides comprehensive capabilities for training machine learning models using scikit-learn, the most widely-used ML library in Python. This skill covers the full model development lifecycle from preprocessing through training, validation, and serialization.

## Purpose

Scikit-learn is the foundation of many ML workflows due to its consistent API, extensive algorithm coverage, and excellent documentation. This skill enables:

- **Automated Model Training**: Train models with proper cross-validation
- **Hyperparameter Optimization**: Find optimal configurations efficiently
- **Pipeline Construction**: Build reproducible preprocessing + modeling pipelines
- **Model Serialization**: Save and load models for deployment

## Use Cases

### 1. Baseline Model Development
Quickly establish baseline performance with standard algorithms before exploring complex approaches.

### 2. Feature Engineering Validation
Test the impact of different feature transformations on model performance.

### 3. Model Comparison
Compare multiple algorithms on the same dataset to select the best approach.

### 4. Production Pipeline Creation
Build end-to-end pipelines that handle preprocessing and prediction consistently.

## Processes That Use This Skill

- **Model Training Pipeline with Experiment Tracking** (`model-training-pipeline.js`)
- **AutoML Pipeline Orchestration** (`automl-pipeline.js`)
- **Feature Engineering Design and Implementation** (`feature-engineering.js`)
- **ML Architecture Design and Model Selection** (`ml-architecture-design.js`)

## Installation

```bash
# Core installation
pip install scikit-learn>=1.0.0 pandas numpy joblib

# Optional enhancements
pip install category_encoders  # Advanced encoding
pip install imbalanced-learn   # Handling imbalanced data
pip install skl2onnx          # ONNX export
pip install yellowbrick       # Visualization
```

## Supported Algorithms

### Classification

| Algorithm | Class | Best For |
|-----------|-------|----------|
| Logistic Regression | `LogisticRegression` | Linear, interpretable |
| Random Forest | `RandomForestClassifier` | General purpose |
| Gradient Boosting | `GradientBoostingClassifier` | High accuracy |
| Support Vector Machine | `SVC` | Small/medium datasets |
| K-Nearest Neighbors | `KNeighborsClassifier` | Simple, non-parametric |
| Naive Bayes | `GaussianNB` | Fast, probabilistic |
| Neural Network | `MLPClassifier` | Complex patterns |

### Regression

| Algorithm | Class | Best For |
|-----------|-------|----------|
| Linear Regression | `LinearRegression` | Baseline, interpretable |
| Ridge Regression | `Ridge` | Regularized linear |
| Lasso Regression | `Lasso` | Feature selection |
| Random Forest | `RandomForestRegressor` | Non-linear, robust |
| Gradient Boosting | `GradientBoostingRegressor` | High accuracy |
| SVR | `SVR` | Small datasets |
| Elastic Net | `ElasticNet` | Mixed regularization |

### Clustering

| Algorithm | Class | Best For |
|-----------|-------|----------|
| K-Means | `KMeans` | Spherical clusters |
| DBSCAN | `DBSCAN` | Arbitrary shapes |
| Hierarchical | `AgglomerativeClustering` | Hierarchical structure |
| Gaussian Mixture | `GaussianMixture` | Probabilistic |

## Example Workflows

### Complete Training Pipeline

```python
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
import joblib

# Load data
df = pd.read_csv('data.csv')
X = df.drop('target', axis=1)
y = df['target']

# Define feature types
numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()

# Create preprocessors
numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

preprocessor = ColumnTransformer([
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features)
])

# Create full pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(random_state=42))
])

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Hyperparameter tuning
param_grid = {
    'classifier__n_estimators': [100, 200],
    'classifier__max_depth': [5, 10, None],
    'classifier__min_samples_split': [2, 5]
}

grid_search = GridSearchCV(
    pipeline, param_grid, cv=5,
    scoring='roc_auc', n_jobs=-1, verbose=1
)
grid_search.fit(X_train, y_train)

# Evaluate
best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test)
y_proba = best_model.predict_proba(X_test)[:, 1]

print(f"Best params: {grid_search.best_params_}")
print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(best_model, 'model.joblib')
```

### Custom Scorer Example

```python
from sklearn.metrics import make_scorer, fbeta_score

# Custom F2 score (recall-weighted)
f2_scorer = make_scorer(fbeta_score, beta=2)

# Use in GridSearchCV
grid_search = GridSearchCV(
    pipeline, param_grid, cv=5,
    scoring=f2_scorer, n_jobs=-1
)
```

### Multi-Metric Evaluation

```python
from sklearn.model_selection import cross_validate

scoring = {
    'accuracy': 'accuracy',
    'precision': 'precision_weighted',
    'recall': 'recall_weighted',
    'f1': 'f1_weighted',
    'roc_auc': 'roc_auc'
}

cv_results = cross_validate(
    pipeline, X_train, y_train,
    cv=5, scoring=scoring, return_train_score=True
)

for metric in scoring.keys():
    test_scores = cv_results[f'test_{metric}']
    print(f"{metric}: {test_scores.mean():.3f} (+/- {test_scores.std():.3f})")
```

## Integration with Other Skills

- **mlflow-experiment-tracker**: Log training runs and metrics
- **optuna-hyperparameter-tuner**: Advanced hyperparameter optimization
- **great-expectations-validator**: Validate training data
- **pandas-dataframe-analyzer**: Explore features before training

## Best Practices

### 1. Use Pipelines
```python
# Good: Preprocessing in pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression())
])

# Bad: Preprocessing outside pipeline (data leakage risk)
X_scaled = StandardScaler().fit_transform(X)  # Uses test data!
```

### 2. Proper Cross-Validation
```python
# Good: Stratified for classification
from sklearn.model_selection import StratifiedKFold
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Good: Time series split for temporal data
from sklearn.model_selection import TimeSeriesSplit
cv = TimeSeriesSplit(n_splits=5)
```

### 3. Handle Imbalanced Data
```python
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE

pipeline = ImbPipeline([
    ('preprocessor', preprocessor),
    ('smote', SMOTE(random_state=42)),
    ('classifier', RandomForestClassifier())
])
```

### 4. Feature Importance Analysis
```python
# For tree-based models
importances = best_model.named_steps['classifier'].feature_importances_
feature_names = best_model.named_steps['preprocessor'].get_feature_names_out()

importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': importances
}).sort_values('importance', ascending=False)
```

## Troubleshooting

### Common Issues

1. **Convergence Warnings**: Increase `max_iter` for iterative algorithms
2. **Memory Errors**: Use `n_jobs=1` or reduce data size
3. **Slow Training**: Use `RandomizedSearchCV` instead of `GridSearchCV`
4. **Poor Performance**: Check for data leakage, feature scaling, class imbalance

### Debug Tips

```python
# Check pipeline steps
print(pipeline.named_steps)

# Inspect transformer output
preprocessed_X = pipeline.named_steps['preprocessor'].fit_transform(X_train)

# View cross-validation details
from sklearn.model_selection import cross_val_predict
y_pred_cv = cross_val_predict(pipeline, X_train, y_train, cv=5, method='predict_proba')
```

## References

- [Scikit-learn Documentation](https://scikit-learn.org/stable/)
- [Scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Pipeline Tutorial](https://scikit-learn.org/stable/modules/compose.html)
- [Model Selection Guide](https://scikit-learn.org/stable/model_selection.html)
- [Claude Scientific Skills](https://github.com/K-Dense-AI/claude-scientific-skills)
