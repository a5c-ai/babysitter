# model-card-generator

Model documentation skill for generating model cards following Google's model card framework.

## Purpose

This skill provides comprehensive model documentation capabilities, enabling teams to create standardized model cards that document model details, intended use, performance, and ethical considerations.

## Key Features

- **Standardized Format**: Following Google's model card framework
- **Multiple Outputs**: HTML, Markdown, and JSON formats
- **Comprehensive Sections**: Model details, metrics, ethics, caveats
- **Version Tracking**: Document model changes over time
- **Validation**: Warnings for missing recommended sections

## When to Use

- Documenting models before deployment
- Regulatory compliance documentation
- Internal model governance
- Sharing model information with stakeholders
- Tracking model versions and changes

## Integration

Works seamlessly with:
- `mlflow-experiment-tracker` for metrics extraction
- `fairlearn-bias-detector` for fairness documentation
- `shap-explainer` for interpretability documentation
- `evidently-drift-detector` for performance documentation
