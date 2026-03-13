# arize-observability

Arize AI skill for production ML monitoring, embedding drift, and performance analysis.

## Purpose

This skill provides comprehensive ML observability capabilities using Arize AI, enabling teams to monitor model performance, detect embedding drift, and perform root cause analysis in production.

## Key Features

- **Production Logging**: Easy logging of predictions, features, and actuals
- **Embedding Drift**: Specialized drift detection for NLP/CV models
- **Performance Analysis**: Metrics tracking across time and segments
- **Root Cause Analysis**: Automated issue identification
- **Bias Monitoring**: Fairness tracking across segments

## When to Use

- Monitoring ML models in production
- Detecting embedding drift in NLP/CV models
- Analyzing performance degradation root causes
- Monitoring A/B tests between model versions
- Tracking fairness metrics over time

## Integration

Works seamlessly with:
- `evidently-drift-detector` for drift analysis
- `whylabs-monitor` for data profiling
- `mlflow-experiment-tracker` for experiment tracking
- `seldon-model-deployer` for deployment monitoring
