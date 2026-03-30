# lime-explainer

LIME-based local explanation skill for individual predictions across tabular, text, and image data.

## Purpose

This skill provides local model explanations using LIME (Local Interpretable Model-agnostic Explanations), enabling teams to understand individual predictions for any black-box model across multiple data types.

## Key Features

- **Model Agnostic**: Works with any ML model
- **Multi-Modal**: Support for tabular, text, and image data
- **Local Fidelity**: Accurate explanations in the prediction neighborhood
- **Submodular Pick**: Select representative samples for global understanding
- **Visualizations**: Interactive HTML explanations

## When to Use

- Explaining individual predictions to users/stakeholders
- Debugging specific model failures
- Understanding text classification decisions
- Explaining image classification predictions
- Complementing SHAP with local explanations

## Integration

Works seamlessly with:
- `shap-explainer` for complementary global explanations
- `alibi-explainer` for counterfactual explanations
- `fairlearn-bias-detector` for fairness analysis
- `model-card-generator` for documentation
