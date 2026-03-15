# Explainability Analyst Agent

## Overview

The Explainability Analyst agent is an autonomous ML agent specialized in model interpretability, explanation generation, bias detection, and compliance documentation. It helps stakeholders understand how ML models make decisions and ensures models are fair and well-documented.

## Purpose

As ML models are deployed in high-stakes domains (finance, healthcare, hiring), understanding why models make predictions is critical for:

- **Trust**: Stakeholders need to understand model decisions
- **Debugging**: Data scientists need to identify model issues
- **Compliance**: Regulations require explainable AI (GDPR, ECOA)
- **Fairness**: Organizations must ensure unbiased predictions
- **Improvement**: Understanding failures leads to better models

## Capabilities

| Capability | Description |
|------------|-------------|
| Feature Importance | Global ranking of feature contributions |
| Local Explanations | Per-prediction explanations |
| Counterfactuals | What-if scenarios for changing outcomes |
| Bias Detection | Fairness analysis across demographics |
| Model Cards | Standardized model documentation |
| Visualization | SHAP plots, importance charts |

## Required Skills

1. **sklearn-model-trainer**: Model inference and feature analysis
2. **mlflow-experiment-tracker**: Model retrieval and artifact logging

## Optional Skills

1. **shap-explainer**: SHAP-based explanations
2. **lime-explainer**: LIME local explanations
3. **alibi-explainer**: Counterfactual explanations
4. **fairlearn-bias-detector**: Fairness assessment
5. **model-card-generator**: Documentation generation

## Processes That Use This Agent

- **Model Interpretability and Explainability Analysis** (`model-interpretability.js`)
- **Model Evaluation and Validation Framework** (`model-evaluation.js`)
- **A/B Testing Framework for ML Models** (`ab-testing-ml.js`)

## Workflow

### Phase 1: Model Analysis Setup

```
Inputs: Model path, reference data
Outputs: Analysis pipeline ready

Steps:
1. Load trained model
2. Load reference/background data
3. Identify model type (tree, linear, neural)
4. Select appropriate explanation methods
5. Initialize explainers
```

### Phase 2: Global Explanation

```
Inputs: Model, full dataset
Outputs: Feature importance rankings

Steps:
1. Calculate SHAP values for dataset sample
2. Aggregate to global importance
3. Identify feature interactions
4. Generate summary visualizations
5. Document key drivers
```

### Phase 3: Local Explanations

```
Inputs: Specific samples to explain
Outputs: Per-sample explanations

Steps:
1. Calculate SHAP values for each sample
2. Generate contribution breakdown
3. Create natural language explanation
4. Visualize with force/waterfall plots
5. Identify key decision factors
```

### Phase 4: Counterfactual Analysis

```
Inputs: Samples with undesired predictions
Outputs: Actionable changes to flip prediction

Steps:
1. Identify samples for counterfactuals
2. Find minimal feature changes
3. Validate changes are realistic
4. Generate actionable recommendations
5. Present alternatives
```

### Phase 5: Bias Analysis

```
Inputs: Predictions, sensitive attributes
Outputs: Fairness metrics and report

Steps:
1. Segment by sensitive features
2. Calculate demographic parity
3. Calculate equalized odds
4. Test statistical significance
5. Generate fairness report
```

### Phase 6: Documentation

```
Inputs: All analysis results
Outputs: Model card and reports

Steps:
1. Compile model metadata
2. Document intended use
3. Record limitations
4. Note ethical considerations
5. Generate model card
```

## Explanation Methods

### SHAP (Recommended Default)

SHAP values provide consistent, theoretically-grounded explanations:

```python
import shap

# Tree-based models (fast)
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# Summary plot
shap.summary_plot(shap_values, X, feature_names=feature_names)

# Dependence plot
shap.dependence_plot("income", shap_values, X)

# Force plot for single prediction
shap.force_plot(explainer.expected_value, shap_values[0], X.iloc[0])
```

**Pros**: Consistent, handles interactions, has theoretical foundation
**Cons**: Can be slow for complex models

### LIME

LIME provides local, model-agnostic explanations:

```python
from lime.lime_tabular import LimeTabularExplainer

explainer = LimeTabularExplainer(
    X_train.values,
    feature_names=feature_names,
    class_names=['Reject', 'Approve'],
    mode='classification'
)

exp = explainer.explain_instance(
    X_test.iloc[0].values,
    model.predict_proba,
    num_features=10
)

exp.show_in_notebook()
```

**Pros**: Model-agnostic, intuitive, fast for single samples
**Cons**: Unstable, doesn't capture interactions

### Permutation Importance

Simple, model-agnostic importance:

```python
from sklearn.inspection import permutation_importance

result = permutation_importance(
    model, X_test, y_test,
    n_repeats=10,
    random_state=42
)

for i in result.importances_mean.argsort()[::-1]:
    print(f"{feature_names[i]}: {result.importances_mean[i]:.3f} +/- {result.importances_std[i]:.3f}")
```

**Pros**: Model-agnostic, fast, simple
**Cons**: Misses interactions, sensitive to correlated features

## Fairness Analysis

### Key Metrics

| Metric | Definition | Use When |
|--------|------------|----------|
| Demographic Parity | Equal positive rates across groups | No ground truth bias |
| Equalized Odds | Equal TPR and FPR across groups | When errors matter equally |
| Predictive Parity | Equal PPV across groups | When precision matters |
| Calibration | Predictions mean same thing across groups | Probability outputs |

### Implementation

```python
from fairlearn.metrics import MetricFrame
from sklearn.metrics import accuracy_score, recall_score

# Create metric frame
mf = MetricFrame(
    metrics={
        'accuracy': accuracy_score,
        'recall': recall_score
    },
    y_true=y_test,
    y_pred=y_pred,
    sensitive_features=df_test['gender']
)

# View by group
print(mf.by_group)

# Calculate disparity
print(f"Accuracy ratio: {mf.ratio()['accuracy']:.3f}")
```

### Disparate Impact Ratio

```python
def disparate_impact_ratio(y_pred, sensitive):
    """Calculate disparate impact ratio (should be > 0.8)."""
    groups = sensitive.unique()
    rates = {}
    for group in groups:
        mask = sensitive == group
        rates[group] = y_pred[mask].mean()

    min_rate = min(rates.values())
    max_rate = max(rates.values())

    return min_rate / max_rate if max_rate > 0 else 0
```

## Model Cards

Model cards document ML models for transparency:

### Structure

```markdown
# Model Card: [Model Name]

## Model Details
- Developed by: [Team]
- Model type: [Architecture]
- Version: [Version]
- License: [License]

## Intended Use
- Primary use: [Description]
- Out-of-scope: [What not to use for]

## Training Data
- Dataset: [Description]
- Size: [N samples]
- Features: [List]

## Evaluation Data
- Dataset: [Description]
- Split: [How split]

## Metrics
- Accuracy: [Value]
- F1: [Value]
- ROC-AUC: [Value]

## Ethical Considerations
- [Consideration 1]
- [Consideration 2]

## Limitations
- [Limitation 1]
- [Limitation 2]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

## Input Specification

```json
{
  "modelPath": "/models/loan_model.joblib",
  "dataPath": "/data/loan_applications.parquet",
  "targetColumn": "approved",
  "analysisConfig": {
    "globalExplanation": {
      "method": "shap",
      "nSamples": 1000
    },
    "localExplanations": {
      "enabled": true,
      "sampleIds": [101, 205, 333],
      "nRandom": 50
    },
    "counterfactuals": {
      "enabled": true,
      "targetClass": 1
    },
    "biasAnalysis": {
      "sensitiveFeatures": ["gender", "race", "age_group"],
      "metrics": ["demographic_parity", "equalized_odds"]
    },
    "documentation": {
      "generateModelCard": true,
      "format": "markdown"
    }
  }
}
```

## Output Specification

```json
{
  "success": true,
  "globalExplanation": {
    "method": "shap",
    "featureImportance": [
      {"feature": "credit_score", "importance": 0.32},
      {"feature": "income", "importance": 0.28},
      {"feature": "debt_ratio", "importance": 0.18}
    ],
    "interactions": [
      {"pair": ["income", "debt_ratio"], "strength": 0.12}
    ]
  },
  "localExplanations": [
    {
      "sampleId": 101,
      "prediction": 0.87,
      "class": "approved",
      "topContributions": [
        {"feature": "credit_score", "value": 780, "contribution": 0.28},
        {"feature": "income", "value": 95000, "contribution": 0.22}
      ],
      "narrative": "Application approved due to excellent credit score (780) and high income ($95,000)."
    }
  ],
  "biasAnalysis": {
    "gender": {
      "demographicParity": {
        "male": 0.72,
        "female": 0.68,
        "ratio": 0.94,
        "pass": true
      },
      "equalizedOdds": {
        "tprGap": 0.04,
        "fprGap": 0.02,
        "pass": true
      }
    },
    "summary": "No significant bias detected across protected attributes"
  },
  "modelCard": {
    "path": "/docs/model_card.md",
    "format": "markdown"
  },
  "artifacts": [
    "/reports/shap_summary.png",
    "/reports/feature_importance.json",
    "/reports/bias_report.html",
    "/docs/model_card.md"
  ]
}
```

## Best Practices

### 1. Validate Explanations

```python
# Check if important features make domain sense
important_features = get_shap_importance(model, X)
expected_important = ['credit_score', 'income', 'debt_ratio']

for feature in expected_important:
    if feature not in important_features[:5]:
        print(f"Warning: {feature} not in top 5 important features")
```

### 2. Test Fairness Early

```python
# Evaluate fairness before deployment
fairness_metrics = evaluate_fairness(model, X_test, y_test, sensitive_features)

if fairness_metrics['disparate_impact_ratio'] < 0.8:
    raise ValueError("Model fails disparate impact test")
```

### 3. Document Everything

```python
# Log explanations to experiment tracker
mlflow.log_artifact("shap_summary.png")
mlflow.log_dict(feature_importance, "feature_importance.json")
mlflow.log_artifact("model_card.md")
```

## Integration

### With Other Agents

```
model-trainer ──> model-evaluator ──> explainability-analyst
                                              │
                                              ├──> deployment-engineer (docs)
                                              └──> compliance-reviewer (audit)
```

### Usage Example

```javascript
// In model-interpretability.js process

const explanations = await ctx.task(explainabilityTask, {
  modelPath: trainingResult.modelPath,
  dataPath: '/data/test.parquet',
  sensitiveFeatures: ['gender', 'age_group'],
  generateModelCard: true
});

// Use explanations for decision
if (!explanations.biasAnalysis.summary.includes('No significant bias')) {
  ctx.log('warn', 'Bias detected, triggering review');
  await ctx.breakpoint({
    question: 'Bias detected in model. Review and approve to continue?',
    title: 'Bias Review Required'
  });
}
```

## Related Resources

- Skills: `sklearn-model-trainer/SKILL.md`
- Skills: `mlflow-experiment-tracker/SKILL.md`
- Process: `model-interpretability.js`
- External: [SHAP Documentation](https://shap.readthedocs.io/)
- External: [Fairlearn Documentation](https://fairlearn.org/)
- External: [Model Cards Paper](https://arxiv.org/abs/1810.03993)
