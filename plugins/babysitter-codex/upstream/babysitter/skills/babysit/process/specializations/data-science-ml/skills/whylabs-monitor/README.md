# whylabs-monitor

WhyLabs integration skill for ML observability, profile logging, and anomaly detection.

## Purpose

This skill provides comprehensive ML observability capabilities using WhyLabs and whylogs, enabling teams to monitor data quality, detect anomalies, and maintain healthy ML systems in production.

## Key Features

- **Data Profiling**: Statistical summaries with whylogs
- **Anomaly Detection**: Automatic detection of data issues
- **Segment Analysis**: Monitor data subsets independently
- **Dashboards**: Visual monitoring in WhyLabs platform
- **Alerts**: Configurable notifications for issues

## When to Use

- Monitoring production data quality
- Detecting data drift early
- Validating incoming data against constraints
- Debugging data-related model issues
- Establishing baselines for comparison

## Integration

Works seamlessly with:
- `evidently-drift-detector` for drift analysis
- `arize-observability` for model monitoring
- `great-expectations-validator` for data validation
- `mlflow-experiment-tracker` for experiment tracking
