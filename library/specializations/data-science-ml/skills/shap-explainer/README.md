# shap-explainer

SHAP-based model explainability skill for feature attribution, summary plots, and interaction analysis.

## Purpose

This skill provides comprehensive model explainability using SHAP (SHapley Additive exPlanations), enabling teams to understand feature contributions, identify important features, and explain individual predictions.

## Key Features

- **Multiple Explainers**: Tree, Deep, Kernel, Linear, and Gradient explainers
- **Feature Attribution**: Quantify feature contributions to predictions
- **Visualizations**: Summary, bar, waterfall, force, and dependence plots
- **Interactions**: Compute and visualize feature interactions
- **Cohort Analysis**: Compare explanations across data segments

## When to Use

- Understanding which features drive model predictions
- Explaining individual predictions to stakeholders
- Validating model behavior and fairness
- Debugging model issues
- Generating compliance documentation

## Integration

Works seamlessly with:
- `sklearn-model-trainer` for scikit-learn models
- `pytorch-trainer` for neural networks
- `lime-explainer` for complementary explanations
- `fairlearn-bias-detector` for fairness analysis
