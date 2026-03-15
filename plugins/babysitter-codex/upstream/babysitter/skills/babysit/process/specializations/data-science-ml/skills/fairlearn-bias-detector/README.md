# fairlearn-bias-detector

Fairness assessment skill using Fairlearn for bias detection, mitigation, and compliance reporting.

## Purpose

This skill provides comprehensive fairness assessment capabilities using Fairlearn, enabling teams to detect bias, mitigate unfairness, and generate compliance documentation for ML models.

## Key Features

- **Bias Detection**: Measure demographic parity, equalized odds, and more
- **Mitigation Algorithms**: Threshold optimization, reductions, grid search
- **Disparity Metrics**: Quantify unfairness across groups
- **Compliance Reports**: Documentation for regulatory requirements
- **Intersectional Analysis**: Analyze multiple sensitive attributes

## When to Use

- Assessing model fairness before deployment
- Regulatory compliance (GDPR, ECOA, etc.)
- Mitigating identified biases in models
- Monitoring fairness in production
- Documenting fairness for stakeholders

## Integration

Works seamlessly with:
- `shap-explainer` for feature attribution
- `lime-explainer` for local explanations
- `model-card-generator` for documentation
- `sklearn-model-trainer` for model training
