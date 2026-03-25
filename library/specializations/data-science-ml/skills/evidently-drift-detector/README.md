# Evidently Drift Detector Skill

## Overview

The Evidently Drift Detector skill provides comprehensive ML monitoring capabilities using Evidently AI, an open-source framework for ML and LLM observability. This skill enables detection of data drift, model performance degradation, and automated generation of monitoring reports.

## Purpose

ML models degrade over time due to data drift and concept drift. Evidently provides tools to detect these issues early and trigger appropriate remediation actions. This skill enables:

- **Drift Detection**: Identify when production data differs from training data
- **Performance Monitoring**: Track model metrics over time
- **Automated Alerts**: Trigger retraining or investigation when thresholds are breached
- **Root Cause Analysis**: Understand which features are causing issues

## Use Cases

### 1. Production Model Monitoring
Continuously monitor deployed models for performance degradation.

### 2. Retraining Trigger
Automatically detect when models need retraining due to data drift.

### 3. Data Quality Monitoring
Ensure incoming data meets quality standards before prediction.

### 4. Model Comparison
Compare performance between model versions during A/B tests.

## Processes That Use This Skill

- **Model Performance Monitoring and Drift Detection** (`model-monitoring-drift.js`)
- **ML System Observability and Incident Response** (`ml-observability.js`)
- **ML Model Retraining Pipeline** (`model-retraining.js`)
- **A/B Testing Framework for ML Models** (`ab-testing-ml.js`)

## Installation

```bash
# Core installation
pip install evidently>=0.4.0

# Optional: Spark support
pip install evidently[spark]

# Optional: Full visualization
pip install plotly nbformat
```

## Quick Start

### 1. Basic Drift Report

```python
import pandas as pd
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset

# Load data
reference_data = pd.read_csv('training_data.csv')
current_data = pd.read_csv('production_data.csv')

# Define column mapping
column_mapping = ColumnMapping(
    target='target',
    prediction='prediction',
    numerical_features=['feature_1', 'feature_2'],
    categorical_features=['category_1']
)

# Create and run report
report = Report(metrics=[DataDriftPreset()])
report.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=column_mapping
)

# Save HTML report
report.save_html('drift_report.html')

# Get programmatic results
results = report.as_dict()
print(f"Dataset drift detected: {results['metrics'][0]['result']['dataset_drift']}")
```

### 2. Test Suite for Automation

```python
from evidently.test_suite import TestSuite
from evidently.test_preset import DataDriftTestPreset

# Create test suite
test_suite = TestSuite(tests=[DataDriftTestPreset()])

# Run tests
test_suite.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=column_mapping
)

# Check if all tests passed
summary = test_suite.as_dict()['summary']
if summary['all_passed']:
    print("No significant drift detected")
else:
    print(f"Tests failed: {summary['failed_tests']}")
```

### 3. Model Performance Monitoring

```python
from evidently.metric_preset import ClassificationPreset

report = Report(metrics=[ClassificationPreset()])
report.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=column_mapping
)

# Extract key metrics
results = report.as_dict()
current_metrics = results['metrics'][0]['result']['current']
print(f"Current Accuracy: {current_metrics['accuracy']:.3f}")
print(f"Current F1: {current_metrics['f1']:.3f}")
```

## Drift Detection Methods

### Statistical Tests

| Test | Code | Best For |
|------|------|----------|
| Kolmogorov-Smirnov | `ks` | Numerical features, general |
| Population Stability Index | `psi` | Production monitoring, interpretable |
| Wasserstein | `wasserstein` | Distribution shape changes |
| Jensen-Shannon | `jensenshannon` | Probability distributions |
| Chi-Square | `chisquare` | Categorical features |
| Z-Test | `z` | Large samples, approximately normal |

### Configuring Drift Tests

```python
from evidently.options import DataDriftOptions

options = DataDriftOptions(
    drift_share=0.3,           # Fraction of features needed for dataset drift
    stattest='psi',            # Statistical test to use
    stattest_threshold=0.1,    # Threshold for individual feature drift
    num_stattest='ks',         # Test for numerical features
    cat_stattest='chisquare',  # Test for categorical features
)
```

## Available Presets

### Metric Presets

| Preset | Purpose | Key Metrics |
|--------|---------|-------------|
| `DataDriftPreset` | Feature drift | Drift share, p-values, distributions |
| `DataQualityPreset` | Data quality | Missing values, duplicates, constants |
| `ClassificationPreset` | Classification | Accuracy, precision, recall, F1, ROC-AUC |
| `RegressionPreset` | Regression | MAE, RMSE, MAPE, R2 |
| `TargetDriftPreset` | Target drift | Target distribution changes |

### Test Presets

| Preset | Purpose |
|--------|---------|
| `DataDriftTestPreset` | Automated drift checks |
| `DataQualityTestPreset` | Data quality validation |
| `DataStabilityTestPreset` | Data consistency checks |
| `NoTargetPerformanceTestPreset` | Proxy metrics without labels |

## Integration Patterns

### Retraining Pipeline Trigger

```python
def should_retrain(reference_df, current_df, column_mapping, drift_threshold=0.3):
    """Determine if model should be retrained based on drift."""
    from evidently.tests import TestShareOfDriftedColumns

    test_suite = TestSuite(tests=[
        TestShareOfDriftedColumns(lt=drift_threshold)
    ])

    test_suite.run(
        reference_data=reference_df,
        current_data=current_df,
        column_mapping=column_mapping
    )

    results = test_suite.as_dict()
    needs_retraining = not results['summary']['all_passed']
    drift_share = results['tests'][0]['result']['current']

    return {
        'retrain': needs_retraining,
        'drift_share': drift_share,
        'threshold': drift_threshold,
        'reason': f"Drift share {drift_share:.2f} exceeds threshold {drift_threshold}"
            if needs_retraining else "Drift within acceptable limits"
    }
```

### Monitoring Dashboard Integration

```python
def get_monitoring_metrics(reference_df, current_df, column_mapping):
    """Extract metrics for dashboard visualization."""
    from evidently.metrics import (
        DatasetDriftMetric,
        DatasetMissingValuesMetric,
        ClassificationQualityMetric
    )

    report = Report(metrics=[
        DatasetDriftMetric(),
        DatasetMissingValuesMetric(),
        ClassificationQualityMetric()
    ])

    report.run(
        reference_data=reference_df,
        current_data=current_df,
        column_mapping=column_mapping
    )

    results = report.as_dict()

    return {
        'drift_detected': results['metrics'][0]['result']['dataset_drift'],
        'drift_share': results['metrics'][0]['result']['drift_share'],
        'missing_values_share': results['metrics'][1]['result']['current']['share_of_missing_values'],
        'accuracy': results['metrics'][2]['result']['current']['accuracy'],
        'timestamp': datetime.now().isoformat()
    }
```

### Alert Configuration

```python
def check_alerts(reference_df, current_df, column_mapping):
    """Check multiple alert conditions."""
    from evidently.tests import (
        TestShareOfDriftedColumns,
        TestAccuracyScore,
        TestShareOfMissingValues
    )

    test_suite = TestSuite(tests=[
        TestShareOfDriftedColumns(lt=0.3),
        TestAccuracyScore(gte=0.85),
        TestShareOfMissingValues(lte=0.1)
    ])

    test_suite.run(
        reference_data=reference_df,
        current_data=current_df,
        column_mapping=column_mapping
    )

    alerts = []
    for test in test_suite.as_dict()['tests']:
        if test['status'] == 'FAIL':
            alerts.append({
                'test': test['name'],
                'current_value': test['result']['current'],
                'threshold': test['parameters']
            })

    return alerts
```

## Best Practices

### 1. Choose Reference Data Wisely

```python
# Good: Recent production data as reference
reference = production_data.query("date >= '2024-01-01' and date < '2024-02-01'")

# Avoid: Training data as reference (may not reflect production)
# reference = training_data  # Not recommended
```

### 2. Set Appropriate Thresholds

```python
# Start conservative, adjust based on experience
drift_options = DataDriftOptions(
    drift_share=0.5,        # Start at 50%, tighten if needed
    stattest_threshold=0.1  # Standard PSI threshold
)
```

### 3. Monitor Important Features First

```python
# Focus on high-impact features
important_features = ['revenue', 'user_engagement', 'conversion_rate']

report = Report(metrics=[
    ColumnDriftMetric(column_name=feature)
    for feature in important_features
])
```

### 4. Combine Multiple Signals

```python
# Don't rely on drift alone
test_suite = TestSuite(tests=[
    TestShareOfDriftedColumns(lt=0.3),     # Data drift
    TestAccuracyScore(gte=0.85),           # Performance
    TestShareOfMissingValues(lte=0.1),     # Data quality
    TestColumnShareOfMissingValues(        # Specific column
        column_name='critical_feature',
        lte=0.05
    )
])
```

## Troubleshooting

### Common Issues

1. **All Features Show Drift**: Check if time-based features are included
2. **No Drift Detected**: Verify reference data is appropriate
3. **Slow Reports**: Sample large datasets
4. **Missing Metrics**: Ensure column mapping is correct

### Debug Tips

```python
# Check column mapping
print(f"Numerical: {column_mapping.numerical_features}")
print(f"Categorical: {column_mapping.categorical_features}")
print(f"Target: {column_mapping.target}")

# Verify data shapes
print(f"Reference: {reference_df.shape}")
print(f"Current: {current_df.shape}")

# Sample for quick testing
report.run(
    reference_data=reference_df.sample(10000),
    current_data=current_df.sample(10000),
    column_mapping=column_mapping
)
```

## Integration with Other Skills

- **mlflow-experiment-tracker**: Log drift reports as artifacts
- **great-expectations-validator**: Combine with data quality checks
- **sklearn-model-trainer**: Trigger retraining based on drift
- **model-card-generator**: Document model monitoring setup

## References

- [Evidently AI Documentation](https://docs.evidentlyai.com/)
- [Evidently GitHub](https://github.com/evidentlyai/evidently)
- [ML Monitoring Blog](https://www.evidentlyai.com/blog)
- [Evidently UI](https://www.evidentlyai.com/evidently-ui)
