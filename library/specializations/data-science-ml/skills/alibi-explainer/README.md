# alibi-explainer

Alibi explainability skill for counterfactual explanations, anchors, and trust scores.

## Purpose

This skill provides advanced model explainability using Alibi, enabling teams to generate counterfactual explanations, anchor rules, and trust scores for complex models.

## Key Features

- **Counterfactuals**: "What-if" explanations showing minimal changes for different outcomes
- **Anchors**: High-precision rule-based explanations
- **Trust Scores**: Confidence measures for predictions
- **CEM**: Contrastive explanations with pertinent positives/negatives
- **Integrated Gradients**: Attribution for neural networks

## When to Use

- Explaining why a specific outcome occurred and what could change it
- Generating rule-based explanations for stakeholders
- Measuring prediction confidence
- Regulatory compliance requiring contrastive explanations
- Debugging edge cases and model failures

## Integration

Works seamlessly with:
- `shap-explainer` for feature attribution
- `lime-explainer` for local explanations
- `fairlearn-bias-detector` for fairness analysis
- `model-card-generator` for documentation
