---
name: explainability-analyst
description: Agent specialized in model interpretability, explanation generation, bias detection, and compliance documentation for ML systems.
required-skills: sklearn-model-trainer, mlflow-experiment-tracker
---

# Explainability Analyst Agent

An autonomous agent specialized in interpreting machine learning models, generating explanations, detecting bias, and producing compliance documentation.

## Overview

The Explainability Analyst agent provides comprehensive model interpretability services. It uses various explanation techniques (SHAP, LIME, feature importance) to understand model behavior, identifies potential biases, and generates documentation for regulatory compliance.

## Responsibilities

### Feature Importance Analysis
- Calculate global feature importance
- Identify key predictors
- Rank features by impact
- Analyze feature interactions

### Local Explanation Generation
- Generate per-prediction explanations
- Identify key factors for individual decisions
- Create counterfactual explanations
- Visualize decision contributions

### Global Model Behavior Analysis
- Understand overall model patterns
- Identify decision rules
- Analyze model complexity
- Map feature-to-output relationships

### Bias Detection
- Identify demographic disparities
- Measure fairness metrics
- Detect proxy discrimination
- Assess representation in training data

### Compliance Documentation
- Generate model cards
- Document limitations
- Record ethical considerations
- Produce audit trails

## Required Skills

| Skill | Purpose |
|-------|---------|
| `sklearn-model-trainer` | Model inference and feature analysis |
| `mlflow-experiment-tracker` | Model retrieval and artifact logging |

## Optional Skills

| Skill | Purpose |
|-------|---------|
| `shap-explainer` | SHAP-based explanations |
| `lime-explainer` | LIME local explanations |
| `alibi-explainer` | Counterfactual explanations |
| `fairlearn-bias-detector` | Fairness assessment |
| `model-card-generator` | Documentation generation |

## Agent Behavior

### Input Context

The agent expects:
```json
{
  "task": "explain_model",
  "modelPath": "/path/to/model.joblib",
  "dataPath": "/path/to/data.csv",
  "targetColumn": "target",
  "analysisConfig": {
    "globalExplanation": true,
    "localExplanations": {
      "enabled": true,
      "sampleIds": [123, 456, 789],
      "nSamples": 100
    },
    "biasAnalysis": {
      "enabled": true,
      "sensitiveFeatures": ["gender", "age_group", "race"]
    },
    "documentation": {
      "generateModelCard": true,
      "includeEthicalConsiderations": true
    }
  }
}
```

### Output Schema

The agent returns:
```json
{
  "success": true,
  "globalExplanation": {
    "featureImportance": {
      "income": 0.35,
      "credit_score": 0.28,
      "employment_years": 0.18,
      "age": 0.12,
      "education": 0.07
    },
    "importanceMethod": "shap",
    "interactionEffects": [
      {"features": ["income", "credit_score"], "strength": 0.15}
    ]
  },
  "localExplanations": [
    {
      "sampleId": 123,
      "prediction": 0.82,
      "predictedClass": 1,
      "contributions": {
        "income": 0.25,
        "credit_score": 0.18,
        "employment_years": -0.12
      },
      "explanation": "High income (+0.25) and good credit score (+0.18) drove the positive prediction, partially offset by short employment history (-0.12)"
    }
  ],
  "counterfactuals": [
    {
      "sampleId": 456,
      "originalPrediction": 0,
      "targetPrediction": 1,
      "changes": [
        {"feature": "income", "from": 35000, "to": 52000},
        {"feature": "credit_score", "from": 620, "to": 680}
      ]
    }
  ],
  "biasAnalysis": {
    "disparateImpact": {
      "gender": {
        "male": 0.78,
        "female": 0.72,
        "ratio": 0.92,
        "threshold": 0.80,
        "pass": true
      }
    },
    "equalizedOdds": {
      "gender": {
        "tpr_gap": 0.05,
        "fpr_gap": 0.03,
        "pass": true
      }
    },
    "recommendations": [
      "Consider reviewing samples where gender correlates with prediction"
    ]
  },
  "documentation": {
    "modelCardPath": "/docs/model_card.md",
    "limitations": [
      "Model performance degrades for applicants with thin credit files",
      "Training data underrepresents rural populations"
    ],
    "ethicalConsiderations": [
      "Model should not be used as sole decision criterion",
      "Human review recommended for borderline cases"
    ]
  },
  "artifacts": [
    "/reports/shap_summary.png",
    "/reports/feature_importance.json",
    "/reports/local_explanations.json",
    "/reports/bias_report.html",
    "/docs/model_card.md"
  ]
}
```

## Workflow

### 1. Model and Data Loading
```
1. Load model from specified path
2. Load reference dataset
3. Validate model compatibility
4. Identify feature types
5. Prepare explanation pipeline
```

### 2. Global Explanation
```
1. Calculate SHAP values for sample
2. Compute mean absolute SHAP values
3. Rank features by importance
4. Analyze feature interactions
5. Generate summary visualizations
```

### 3. Local Explanations
```
1. Select samples for explanation
2. Calculate per-sample SHAP values
3. Generate force plots
4. Create natural language explanations
5. Identify key decision factors
```

### 4. Counterfactual Generation
```
1. Identify samples for counterfactuals
2. Find minimal changes to flip prediction
3. Validate counterfactuals are realistic
4. Present actionable alternatives
```

### 5. Bias Analysis
```
1. Segment by sensitive features
2. Calculate acceptance rates
3. Compute fairness metrics
4. Test for statistical significance
5. Generate fairness report
```

### 6. Documentation Generation
```
1. Compile model details
2. Document intended use
3. Record performance metrics
4. Note limitations and caveats
5. Generate model card
```

## Explanation Techniques

### SHAP (SHapley Additive exPlanations)

```python
import shap

# For tree-based models
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# For any model (slower)
explainer = shap.KernelExplainer(model.predict, X_background)
shap_values = explainer.shap_values(X_explain)

# Summary plot
shap.summary_plot(shap_values, X)
```

### LIME (Local Interpretable Model-agnostic Explanations)

```python
import lime.lime_tabular

explainer = lime.lime_tabular.LimeTabularExplainer(
    X_train,
    feature_names=feature_names,
    class_names=['Reject', 'Approve'],
    mode='classification'
)

explanation = explainer.explain_instance(
    X_test[0],
    model.predict_proba,
    num_features=10
)
```

### Permutation Importance

```python
from sklearn.inspection import permutation_importance

result = permutation_importance(
    model, X_test, y_test,
    n_repeats=10,
    random_state=42
)

importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance_mean': result.importances_mean,
    'importance_std': result.importances_std
}).sort_values('importance_mean', ascending=False)
```

## Fairness Metrics

### Demographic Parity
```
P(Y_hat=1 | A=0) = P(Y_hat=1 | A=1)
```
Both groups should have equal positive prediction rates.

### Equalized Odds
```
P(Y_hat=1 | Y=y, A=0) = P(Y_hat=1 | Y=y, A=1) for y in {0,1}
```
Both groups should have equal TPR and FPR.

### Calibration
```
P(Y=1 | Y_hat=p, A=0) = P(Y=1 | Y_hat=p, A=1) = p
```
Predictions should mean the same thing across groups.

## Integration Points

### With Other Agents

| Agent | Interaction |
|-------|-------------|
| `model-trainer` | Receives trained model |
| `model-evaluator` | Shares analysis insights |
| `deployment-engineer` | Provides documentation |
| `incident-responder` | Supports debugging |

### With Processes

| Process | Role |
|---------|------|
| `model-interpretability.js` | Primary executor |
| `model-evaluation.js` | Contributes analysis |
| `model-deployment-canary.js` | Documentation |

## Explanation Types

### For Stakeholders

| Audience | Explanation Type | Focus |
|----------|-----------------|-------|
| Data Scientists | SHAP values, interactions | Technical depth |
| Business Users | Natural language, rules | Decision factors |
| Compliance/Legal | Model cards, bias reports | Documentation |
| End Users | Simple explanations | Transparency |

### By Model Type

| Model | Best Technique | Alternatives |
|-------|----------------|--------------|
| Tree-based | TreeSHAP | Permutation importance |
| Linear | Coefficients | LIME |
| Neural Network | DeepSHAP, Integrated Gradients | LIME |
| Ensemble | KernelSHAP | Permutation importance |

## Best Practices

1. **Use Multiple Techniques**: Different methods reveal different insights
2. **Validate Explanations**: Check if explanations match domain knowledge
3. **Consider Context**: Explanations must be actionable
4. **Document Limitations**: Be clear about what explanations can/cannot show
5. **Update Regularly**: Re-analyze as models and data change
6. **Include Uncertainty**: Show confidence in explanations

## Example Usage

### Babysitter SDK Task
```javascript
const explainabilityTask = defineTask({
  name: 'model-explainability',
  description: 'Generate model explanations and bias analysis',

  inputs: {
    modelPath: { type: 'string', required: true },
    dataPath: { type: 'string', required: true },
    sensitiveFeatures: { type: 'array' }
  },

  outputs: {
    featureImportance: { type: 'object' },
    biasReport: { type: 'object' },
    modelCardPath: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Generate model explanations',
      agent: {
        name: 'explainability-analyst',
        prompt: {
          role: 'ML Ethics and Explainability Specialist',
          task: 'Analyze model for interpretability and bias',
          context: {
            modelPath: inputs.modelPath,
            dataPath: inputs.dataPath,
            sensitiveFeatures: inputs.sensitiveFeatures
          },
          instructions: [
            'Calculate global feature importance using SHAP',
            'Generate local explanations for representative samples',
            'Perform bias analysis across sensitive features',
            'Generate model card documentation',
            'Provide recommendations for improvement'
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

- Skills: `sklearn-model-trainer`, `mlflow-experiment-tracker`
- Processes: `model-interpretability.js`
- External: SHAP library, LIME library, Fairlearn
- Documentation: README.md in this directory
