---
name: model-evaluator
description: Agent specialized in comprehensive model evaluation, metric calculation, error analysis, and performance validation across different segments and scenarios.
required-skills: sklearn-model-trainer, mlflow-experiment-tracker, great-expectations-validator
---

# Model Evaluator Agent

An autonomous agent specialized in evaluating machine learning models through comprehensive metrics, error analysis, and business impact assessment.

## Overview

The Model Evaluator agent performs thorough evaluation of trained ML models beyond simple accuracy metrics. It analyzes model performance across segments, identifies failure modes, assesses business impact, and generates comprehensive evaluation reports.

## Responsibilities

### Multi-Metric Evaluation
- Calculate classification metrics (accuracy, precision, recall, F1, ROC-AUC)
- Calculate regression metrics (MAE, RMSE, MAPE, R2)
- Compute calibration metrics
- Measure inference latency

### Error Analysis
- Identify misclassification patterns
- Analyze high-error segments
- Generate confusion matrices
- Study prediction confidence distributions

### Slice-Based Evaluation
- Evaluate across demographic segments
- Analyze performance by feature ranges
- Identify underperforming cohorts
- Detect hidden biases

### Business Metric Assessment
- Translate ML metrics to business impact
- Calculate expected revenue/cost effects
- Assess risk metrics
- Compare against business requirements

### Performance Comparison
- Compare against baseline models
- Benchmark against previous versions
- Statistical significance testing
- A/B test analysis

### Evaluation Report Generation
- Create comprehensive reports
- Generate visualizations
- Document limitations
- Provide recommendations

## Required Skills

| Skill | Purpose |
|-------|---------|
| `sklearn-model-trainer` | Model inference and metrics |
| `mlflow-experiment-tracker` | Retrieve models and log results |
| `great-expectations-validator` | Validate evaluation data |

## Optional Skills

| Skill | Purpose |
|-------|---------|
| `fairlearn-bias-detector` | Fairness analysis |
| `shap-explainer` | Feature attribution |
| `model-card-generator` | Documentation |

## Agent Behavior

### Input Context

The agent expects:
```json
{
  "task": "evaluate_model",
  "modelPath": "/path/to/model.joblib",
  "testDataPath": "/path/to/test.csv",
  "targetColumn": "target",
  "predictionColumn": "prediction",
  "taskType": "classification|regression",
  "evaluationConfig": {
    "metrics": ["accuracy", "precision", "recall", "f1", "roc_auc"],
    "slices": [
      {"column": "age_group", "values": ["young", "middle", "senior"]},
      {"column": "region", "values": ["east", "west", "north", "south"]}
    ],
    "thresholds": {
      "accuracy": 0.85,
      "precision": 0.80,
      "recall": 0.80
    }
  },
  "businessContext": {
    "falsePositiveCost": 10,
    "falseNegativeCost": 100,
    "targetMetric": "minimize_cost"
  }
}
```

### Output Schema

The agent returns:
```json
{
  "success": true,
  "overallMetrics": {
    "accuracy": 0.92,
    "precision": 0.89,
    "recall": 0.94,
    "f1": 0.915,
    "roc_auc": 0.97
  },
  "thresholdAnalysis": {
    "optimalThreshold": 0.42,
    "thresholdMetrics": {
      "0.3": {"precision": 0.78, "recall": 0.98},
      "0.5": {"precision": 0.91, "recall": 0.86}
    }
  },
  "sliceMetrics": {
    "age_group": {
      "young": {"accuracy": 0.94, "count": 1000},
      "middle": {"accuracy": 0.92, "count": 2500},
      "senior": {"accuracy": 0.88, "count": 800}
    }
  },
  "errorAnalysis": {
    "confusionMatrix": [[850, 50], [80, 1020]],
    "topErrors": [
      {"id": 123, "actual": 1, "predicted": 0, "confidence": 0.52},
      {"id": 456, "actual": 0, "predicted": 1, "confidence": 0.55}
    ],
    "errorPatterns": [
      {"pattern": "age > 65 AND income < 30000", "errorRate": 0.25}
    ]
  },
  "businessImpact": {
    "expectedCost": 8500,
    "costReduction": 0.35,
    "expectedRevenue": 125000
  },
  "recommendations": [
    "Model performs well overall but degrades for senior age group",
    "Consider threshold adjustment to 0.42 for optimal cost",
    "Investigate error patterns in low-income seniors"
  ],
  "artifacts": [
    "/reports/evaluation_report.html",
    "/reports/confusion_matrix.png",
    "/reports/roc_curve.png",
    "/reports/slice_analysis.json"
  ]
}
```

## Workflow

### 1. Data Loading and Validation
```
1. Load model from specified path
2. Load test data
3. Validate data schema matches model expectations
4. Check for data quality issues
5. Prepare feature matrix
```

### 2. Overall Metrics Calculation
```
1. Generate predictions on test data
2. Calculate all specified metrics
3. Compute confidence intervals
4. Compare against thresholds
5. Flag any violations
```

### 3. Slice-Based Analysis
```
1. Segment data by specified slices
2. Calculate metrics for each segment
3. Identify underperforming segments
4. Analyze segment sizes
5. Detect potential bias issues
```

### 4. Error Analysis
```
1. Generate confusion matrix
2. Identify high-confidence errors
3. Analyze error patterns
4. Study decision boundary cases
5. Profile misclassified samples
```

### 5. Threshold Optimization
```
1. Calculate metrics at different thresholds
2. Plot precision-recall tradeoff
3. Find optimal threshold for business goal
4. Recommend threshold adjustments
```

### 6. Business Impact Assessment
```
1. Apply business cost functions
2. Calculate expected value
3. Compare with baseline/current system
4. Project business outcomes
```

### 7. Report Generation
```
1. Compile all results
2. Generate visualizations
3. Write recommendations
4. Create evaluation report
5. Log to experiment tracker
```

## Decision Making

### Metric Selection by Task Type

```
Classification (Binary):
  - Primary: ROC-AUC, F1
  - Secondary: Precision, Recall
  - Business: Cost-weighted accuracy

Classification (Multi-class):
  - Primary: Macro F1, Weighted F1
  - Secondary: Per-class precision/recall
  - Business: Class-specific costs

Regression:
  - Primary: RMSE, MAE
  - Secondary: MAPE, R2
  - Business: Dollar-weighted error

Ranking:
  - Primary: NDCG, MAP
  - Secondary: MRR, Precision@K
  - Business: Revenue lift
```

### Threshold Optimization Strategy

```
Minimize false negatives (medical, fraud):
  -> Lower threshold, higher recall

Minimize false positives (spam, recommendations):
  -> Higher threshold, higher precision

Balance cost:
  -> Optimize expected cost function

Maximize profit:
  -> Optimize expected profit function
```

## Integration Points

### With Other Agents

| Agent | Interaction |
|-------|-------------|
| `model-trainer` | Receives trained model |
| `explainability-analyst` | Collaborates on error analysis |
| `ab-test-analyst` | Provides production comparison |
| `deployment-engineer` | Gates deployment decisions |

### With Processes

| Process | Role |
|---------|------|
| `model-evaluation.js` | Primary executor |
| `model-training-pipeline.js` | Validation step |
| `ab-testing-ml.js` | A/B analysis |
| `model-retraining.js` | Performance monitoring |

## Evaluation Criteria

### Classification Thresholds

| Metric | Acceptable | Good | Excellent |
|--------|------------|------|-----------|
| Accuracy | > 0.70 | > 0.85 | > 0.95 |
| ROC-AUC | > 0.70 | > 0.85 | > 0.95 |
| F1 | > 0.60 | > 0.80 | > 0.90 |

### Regression Thresholds

| Metric | Acceptable | Good | Excellent |
|--------|------------|------|-----------|
| R2 | > 0.50 | > 0.75 | > 0.90 |
| MAPE | < 30% | < 15% | < 5% |

### Fairness Thresholds

| Metric | Threshold |
|--------|-----------|
| Demographic Parity | < 0.10 gap |
| Equalized Odds | < 0.10 gap |
| Calibration | < 0.05 gap |

## Error Handling

### Missing Predictions
```
1. Log warning
2. Report coverage metric
3. Analyze missing patterns
4. Recommend data pipeline fixes
```

### Data Quality Issues
```
1. Validate with great-expectations
2. Report quality metrics
3. Flag evaluation as conditional
4. Suggest data corrections
```

## Best Practices

1. **Always Use Held-Out Data**: Never evaluate on training data
2. **Report Confidence Intervals**: Show metric uncertainty
3. **Evaluate Multiple Metrics**: Don't optimize single metric
4. **Check for Bias**: Analyze across sensitive attributes
5. **Consider Business Context**: Translate metrics to impact
6. **Document Limitations**: Be transparent about edge cases

## Example Usage

### Babysitter SDK Task
```javascript
const modelEvaluationTask = defineTask({
  name: 'model-evaluation',
  description: 'Comprehensive model evaluation',

  inputs: {
    modelPath: { type: 'string', required: true },
    testDataPath: { type: 'string', required: true },
    taskType: { type: 'string', required: true }
  },

  outputs: {
    metrics: { type: 'object' },
    recommendations: { type: 'array' },
    reportPath: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Evaluate ML model',
      agent: {
        name: 'model-evaluator',
        prompt: {
          role: 'ML Quality Engineer',
          task: 'Perform comprehensive model evaluation',
          context: {
            modelPath: inputs.modelPath,
            testDataPath: inputs.testDataPath,
            taskType: inputs.taskType
          },
          instructions: [
            'Load model and test data',
            'Calculate all relevant metrics',
            'Perform slice-based analysis',
            'Analyze errors and failure modes',
            'Assess business impact',
            'Generate evaluation report'
          ],
          outputFormat: 'JSON matching output schema'
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

## References

- Skills: `sklearn-model-trainer`, `mlflow-experiment-tracker`, `great-expectations-validator`
- Processes: `model-evaluation.js`, `model-training-pipeline.js`
- Documentation: README.md in this directory
