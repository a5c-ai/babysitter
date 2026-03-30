# Model Evaluator Agent

## Overview

The Model Evaluator agent is an autonomous ML agent specialized in comprehensive model evaluation. It goes beyond simple accuracy metrics to provide deep analysis of model performance across segments, error patterns, business impact, and fairness considerations.

## Purpose

Model evaluation is critical for understanding not just how well a model performs, but where it fails and what business impact those failures have. This agent provides:

- **Comprehensive Metrics**: Calculate all relevant metrics for the task type
- **Slice Analysis**: Understand performance across different segments
- **Error Profiling**: Identify patterns in model failures
- **Business Translation**: Convert ML metrics to business outcomes
- **Fairness Assessment**: Detect potential bias in predictions

## Capabilities

| Capability | Description |
|------------|-------------|
| Metric Calculation | Accuracy, precision, recall, F1, ROC-AUC, etc. |
| Slice Analysis | Performance by demographic, feature ranges |
| Error Analysis | Confusion matrix, misclassification patterns |
| Threshold Optimization | Find optimal decision thresholds |
| Business Impact | Cost/revenue implications |
| Comparison | Against baselines and previous versions |
| Reporting | Generate comprehensive evaluation reports |

## Required Skills

1. **sklearn-model-trainer**: Model inference and metrics computation
2. **mlflow-experiment-tracker**: Retrieve models, log evaluation results
3. **great-expectations-validator**: Validate evaluation data quality

## Optional Skills

1. **fairlearn-bias-detector**: Fairness and bias analysis
2. **shap-explainer**: Feature attribution for error analysis
3. **model-card-generator**: Documentation generation

## Processes That Use This Agent

- **Model Evaluation and Validation Framework** (`model-evaluation.js`)
- **A/B Testing Framework for ML Models** (`ab-testing-ml.js`)
- **Model Training Pipeline** (`model-training-pipeline.js`)
- **ML Model Retraining Pipeline** (`model-retraining.js`)

## Workflow

### Phase 1: Setup and Validation

```
Inputs: Model path, test data, configuration
Outputs: Validated model and data

Steps:
1. Load trained model from path or registry
2. Load and validate test dataset
3. Verify feature alignment
4. Check for data quality issues
5. Prepare prediction pipeline
```

### Phase 2: Overall Metrics

```
Inputs: Model predictions, ground truth
Outputs: Metric dictionary with confidence intervals

Steps:
1. Generate predictions on test set
2. Calculate all specified metrics
3. Compute bootstrap confidence intervals
4. Compare against defined thresholds
5. Flag any threshold violations
```

### Phase 3: Slice Analysis

```
Inputs: Predictions, slice definitions
Outputs: Per-slice metrics and gaps

Steps:
1. Segment test data by slice columns
2. Calculate metrics for each segment
3. Identify worst-performing segments
4. Quantify performance gaps
5. Assess statistical significance of gaps
```

### Phase 4: Error Analysis

```
Inputs: Predictions with confidence scores
Outputs: Error patterns and profiles

Steps:
1. Generate confusion matrix
2. Identify high-confidence errors
3. Profile misclassified samples
4. Discover error patterns (rules)
5. Analyze decision boundary cases
```

### Phase 5: Threshold Optimization

```
Inputs: Probability predictions, business costs
Outputs: Optimal threshold recommendation

Steps:
1. Calculate metrics at various thresholds
2. Plot precision-recall curve
3. Apply business cost function
4. Find threshold minimizing expected cost
5. Recommend threshold with rationale
```

### Phase 6: Business Impact

```
Inputs: Metrics, business context
Outputs: Business impact assessment

Steps:
1. Map predictions to business outcomes
2. Calculate expected costs/revenues
3. Compare with baseline system
4. Project annual business impact
5. Identify high-value improvements
```

### Phase 7: Report Generation

```
Inputs: All analysis results
Outputs: Comprehensive report

Steps:
1. Compile all metrics and analyses
2. Generate visualizations
3. Write executive summary
4. List recommendations
5. Log report to experiment tracker
```

## Input Specification

```json
{
  "modelPath": "/models/churn_model_v2.joblib",
  "testDataPath": "/data/test_set.parquet",
  "targetColumn": "churned",
  "taskType": "binary_classification",
  "metrics": ["accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc"],
  "slices": [
    {"column": "tenure_bucket", "values": ["new", "established", "loyal"]},
    {"column": "plan_type", "values": ["basic", "premium", "enterprise"]}
  ],
  "thresholds": {
    "roc_auc": {"minimum": 0.85, "target": 0.90},
    "recall": {"minimum": 0.80, "target": 0.90}
  },
  "businessContext": {
    "truePositiveValue": 500,
    "falsePositiveCost": 50,
    "falseNegativeCost": 200,
    "trueNegativeValue": 0
  },
  "baselineComparison": {
    "modelPath": "/models/churn_model_v1.joblib",
    "metrics": {"roc_auc": 0.82, "recall": 0.75}
  }
}
```

## Output Specification

```json
{
  "success": true,
  "overallMetrics": {
    "accuracy": {"value": 0.912, "ci_lower": 0.898, "ci_upper": 0.926},
    "precision": {"value": 0.887, "ci_lower": 0.865, "ci_upper": 0.909},
    "recall": {"value": 0.935, "ci_lower": 0.918, "ci_upper": 0.952},
    "f1": {"value": 0.910, "ci_lower": 0.894, "ci_upper": 0.926},
    "roc_auc": {"value": 0.968, "ci_lower": 0.958, "ci_upper": 0.978}
  },
  "thresholdResults": {
    "default": 0.5,
    "optimal": 0.42,
    "metricsAtOptimal": {
      "precision": 0.845,
      "recall": 0.962,
      "f1": 0.900
    }
  },
  "sliceAnalysis": {
    "tenure_bucket": {
      "new": {
        "accuracy": 0.88,
        "count": 1500,
        "gap_from_overall": -0.032
      },
      "established": {
        "accuracy": 0.92,
        "count": 3000,
        "gap_from_overall": 0.008
      },
      "loyal": {
        "accuracy": 0.94,
        "count": 500,
        "gap_from_overall": 0.028
      }
    }
  },
  "errorAnalysis": {
    "confusionMatrix": {
      "tn": 3420,
      "fp": 180,
      "fn": 150,
      "tp": 1250
    },
    "topErrorPatterns": [
      {
        "pattern": "tenure_months < 6 AND monthly_charges > 80",
        "error_rate": 0.18,
        "sample_count": 450
      }
    ],
    "highConfidenceErrors": [
      {"sample_id": "12345", "prediction": 0.92, "actual": 0, "features": {...}}
    ]
  },
  "businessImpact": {
    "expectedValue": 542000,
    "vsBaseline": {
      "improvement": 0.23,
      "additionalValue": 102000
    },
    "recommendations": [
      "Model exceeds all thresholds, ready for deployment",
      "Consider threshold 0.42 to optimize for recall in high-cost FN scenario"
    ]
  },
  "comparisonWithBaseline": {
    "roc_auc_improvement": 0.148,
    "recall_improvement": 0.185,
    "statistically_significant": true
  },
  "artifacts": [
    "/reports/evaluation_report.html",
    "/reports/confusion_matrix.png",
    "/reports/roc_curve.png",
    "/reports/slice_performance.png",
    "/reports/threshold_analysis.png"
  ]
}
```

## Evaluation Metrics Reference

### Classification

| Metric | Formula | When to Use |
|--------|---------|-------------|
| Accuracy | (TP+TN)/(TP+TN+FP+FN) | Balanced classes |
| Precision | TP/(TP+FP) | Cost of false positives high |
| Recall | TP/(TP+FN) | Cost of false negatives high |
| F1 | 2*P*R/(P+R) | Balance precision/recall |
| ROC-AUC | Area under ROC | Overall discrimination |
| PR-AUC | Area under PR curve | Imbalanced classes |
| Log Loss | -log(prediction) | Probability calibration |

### Regression

| Metric | Formula | When to Use |
|--------|---------|-------------|
| MAE | mean(|y-y_hat|) | Robust to outliers |
| RMSE | sqrt(mean((y-y_hat)^2)) | Penalize large errors |
| MAPE | mean(|y-y_hat|/y) | Percentage interpretation |
| R2 | 1 - SS_res/SS_tot | Variance explained |

## Best Practices

### 1. Use Proper Test Sets

```python
# Good: Truly held-out test set
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
# Train on X_train only
# Evaluate on X_test only

# Bad: Any data used in training or validation
```

### 2. Report Confidence Intervals

```python
from sklearn.utils import resample

def bootstrap_metric(y_true, y_pred, metric_fn, n_iterations=1000):
    scores = []
    for _ in range(n_iterations):
        indices = resample(range(len(y_true)))
        scores.append(metric_fn(y_true[indices], y_pred[indices]))
    return np.percentile(scores, [2.5, 50, 97.5])
```

### 3. Analyze Multiple Slices

```python
# Evaluate across multiple dimensions
slices = ['age_group', 'gender', 'region', 'income_bucket']
for slice_col in slices:
    for slice_val in df[slice_col].unique():
        slice_data = df[df[slice_col] == slice_val]
        metrics = evaluate(model, slice_data)
        print(f"{slice_col}={slice_val}: {metrics}")
```

### 4. Consider Business Context

```python
# Cost-weighted evaluation
def expected_cost(y_true, y_pred, fp_cost, fn_cost):
    cm = confusion_matrix(y_true, y_pred)
    fp = cm[0, 1]
    fn = cm[1, 0]
    return fp * fp_cost + fn * fn_cost
```

## Integration

### With Other Agents

```
model-trainer ──> model-evaluator ──> deployment-engineer
                       │
                       ├──> explainability-analyst
                       └──> ab-test-analyst
```

### Usage Example

```javascript
// In model-evaluation.js process

const evaluationResult = await ctx.task(modelEvaluationTask, {
  modelPath: trainingResult.modelPath,
  testDataPath: '/data/test.parquet',
  taskType: 'binary_classification',
  thresholds: {
    roc_auc: { minimum: 0.85 },
    recall: { minimum: 0.80 }
  }
});

// Gate deployment on evaluation results
if (evaluationResult.overallMetrics.roc_auc.value >= 0.85) {
  await ctx.task(deploymentTask, { modelPath: trainingResult.modelPath });
} else {
  ctx.log('warn', 'Model below threshold, triggering improvement');
  // Return to training with feedback
}
```

## Related Resources

- Skills: `sklearn-model-trainer/SKILL.md`
- Skills: `mlflow-experiment-tracker/SKILL.md`
- Skills: `great-expectations-validator/SKILL.md`
- Process: `model-evaluation.js`
- Agent: `model-trainer/AGENT.md`
