---
name: evidently-drift-detector
description: Evidently AI skill for data drift detection, model performance monitoring, target drift analysis, and automated reporting for ML systems in production.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# Evidently Drift Detector

Detect data drift, monitor model performance, and generate automated reports using Evidently AI.

## Overview

This skill provides comprehensive capabilities for ML monitoring using Evidently AI. It enables detection of data drift, concept drift, target drift, and model performance degradation in production ML systems.

## Capabilities

### Data Drift Detection
- Feature-level drift detection
- Dataset-level drift analysis
- Multiple drift detection methods (KS, PSI, Wasserstein, etc.)
- Distribution visualization
- Drift magnitude quantification

### Model Performance Monitoring
- Classification metrics tracking
- Regression metrics tracking
- Performance degradation detection
- Slice-based analysis
- Error analysis

### Target Drift Analysis
- Target distribution changes
- Label drift detection
- Prediction drift monitoring
- Class balance monitoring

### Automated Reporting
- HTML report generation
- JSON metrics export
- Dashboard integration
- Custom metric creation
- Test suite execution

### Production Monitoring
- Real-time monitoring integration
- Alerting threshold configuration
- Time-series drift tracking
- Batch comparison analysis

## Prerequisites

### Installation
```bash
pip install evidently>=0.4.0
```

### Optional Dependencies
```bash
# For Spark support
pip install evidently[spark]

# For specific visualizations
pip install plotly nbformat
```

## Usage Patterns

### Basic Data Drift Report
```python
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset

# Define column mapping
column_mapping = ColumnMapping(
    target='target',
    prediction='prediction',
    numerical_features=['feature_1', 'feature_2', 'feature_3'],
    categorical_features=['category_1', 'category_2']
)

# Create drift report
report = Report(metrics=[
    DataDriftPreset()
])

# Run report comparing reference and current data
report.run(
    reference_data=reference_df,
    current_data=current_df,
    column_mapping=column_mapping
)

# Save report
report.save_html("drift_report.html")

# Get metrics as dictionary
metrics_dict = report.as_dict()
```

### Classification Performance Report
```python
from evidently.metric_preset import ClassificationPreset

report = Report(metrics=[
    ClassificationPreset()
])

report.run(
    reference_data=reference_df,
    current_data=current_df,
    column_mapping=column_mapping
)

# Access specific metrics
results = report.as_dict()
accuracy = results['metrics'][0]['result']['current']['accuracy']
```

### Regression Performance Report
```python
from evidently.metric_preset import RegressionPreset

report = Report(metrics=[
    RegressionPreset()
])

report.run(
    reference_data=reference_df,
    current_data=current_df,
    column_mapping=column_mapping
)
```

### Test Suite for Automated Checks
```python
from evidently.test_suite import TestSuite
from evidently.test_preset import DataDriftTestPreset, DataQualityTestPreset

# Create test suite
test_suite = TestSuite(tests=[
    DataDriftTestPreset(),
    DataQualityTestPreset()
])

# Run tests
test_suite.run(
    reference_data=reference_df,
    current_data=current_df,
    column_mapping=column_mapping
)

# Check results
if test_suite.as_dict()['summary']['all_passed']:
    print("All tests passed!")
else:
    failed_tests = [t for t in test_suite.as_dict()['tests'] if t['status'] == 'FAIL']
    print(f"Failed tests: {len(failed_tests)}")
```

### Individual Drift Metrics
```python
from evidently.metrics import (
    DatasetDriftMetric,
    ColumnDriftMetric,
    DataDriftTable,
    TargetByFeaturesTable
)

# Detailed drift analysis
report = Report(metrics=[
    DatasetDriftMetric(),
    ColumnDriftMetric(column_name='feature_1'),
    ColumnDriftMetric(column_name='feature_2'),
    DataDriftTable(),
    TargetByFeaturesTable()
])

report.run(
    reference_data=reference_df,
    current_data=current_df,
    column_mapping=column_mapping
)
```

### Custom Drift Thresholds
```python
from evidently.metrics import DatasetDriftMetric
from evidently.options import DataDriftOptions

# Custom options
options = DataDriftOptions(
    drift_share=0.5,  # Share of drifted features to flag dataset drift
    stattest='psi',   # Statistical test
    stattest_threshold=0.1  # PSI threshold
)

report = Report(metrics=[
    DatasetDriftMetric(options=options)
])
```

### Time-Series Monitoring
```python
import pandas as pd
from datetime import datetime, timedelta

def monitor_over_time(reference_df, production_data_stream, window_days=7):
    """Monitor drift over time windows."""
    results = []

    for window_start in production_data_stream:
        window_end = window_start + timedelta(days=window_days)
        current_window = production_data_stream.query(
            f"timestamp >= '{window_start}' and timestamp < '{window_end}'"
        )

        report = Report(metrics=[DataDriftPreset()])
        report.run(reference_data=reference_df, current_data=current_window)

        metrics = report.as_dict()
        results.append({
            'window_start': window_start,
            'drift_detected': metrics['metrics'][0]['result']['dataset_drift'],
            'drift_share': metrics['metrics'][0]['result']['drift_share']
        })

    return pd.DataFrame(results)
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const driftDetectionTask = defineTask({
  name: 'evidently-drift-detection',
  description: 'Detect data drift between reference and current data',

  inputs: {
    referenceDataPath: { type: 'string', required: true },
    currentDataPath: { type: 'string', required: true },
    targetColumn: { type: 'string' },
    predictionColumn: { type: 'string' },
    numericalFeatures: { type: 'array' },
    categoricalFeatures: { type: 'array' },
    driftThreshold: { type: 'number', default: 0.5 }
  },

  outputs: {
    driftDetected: { type: 'boolean' },
    driftShare: { type: 'number' },
    driftedFeatures: { type: 'array' },
    reportPath: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Detect data drift',
      skill: {
        name: 'evidently-drift-detector',
        context: {
          operation: 'detect_drift',
          referenceDataPath: inputs.referenceDataPath,
          currentDataPath: inputs.currentDataPath,
          targetColumn: inputs.targetColumn,
          predictionColumn: inputs.predictionColumn,
          numericalFeatures: inputs.numericalFeatures,
          categoricalFeatures: inputs.categoricalFeatures,
          driftThreshold: inputs.driftThreshold
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

## Available Presets

### Metric Presets
| Preset | Use Case |
|--------|----------|
| `DataDriftPreset` | Feature drift detection |
| `DataQualityPreset` | Data quality checks |
| `ClassificationPreset` | Classification model performance |
| `RegressionPreset` | Regression model performance |
| `TargetDriftPreset` | Target variable drift |
| `TextOverviewPreset` | Text data analysis |

### Test Presets
| Preset | Use Case |
|--------|----------|
| `DataDriftTestPreset` | Automated drift tests |
| `DataQualityTestPreset` | Data quality validation |
| `DataStabilityTestPreset` | Data stability checks |
| `NoTargetPerformanceTestPreset` | Proxy performance tests |
| `RegressionTestPreset` | Regression performance tests |
| `MulticlassClassificationTestPreset` | Multiclass tests |
| `BinaryClassificationTestPreset` | Binary classification tests |

## Statistical Tests Available

| Test | Method | Best For |
|------|--------|----------|
| `ks` | Kolmogorov-Smirnov | Numerical, general |
| `psi` | Population Stability Index | Production monitoring |
| `wasserstein` | Wasserstein distance | Distribution comparison |
| `jensenshannon` | Jensen-Shannon divergence | Probability distributions |
| `chisquare` | Chi-square | Categorical features |
| `z` | Z-test | Large samples, normal |
| `kl_div` | KL divergence | Information theory |

## ML Pipeline Integration

### Retraining Trigger
```python
def check_retraining_needed(reference_df, current_df, column_mapping, threshold=0.3):
    """Determine if model retraining is needed based on drift."""
    from evidently.test_suite import TestSuite
    from evidently.tests import TestShareOfDriftedColumns

    test_suite = TestSuite(tests=[
        TestShareOfDriftedColumns(lt=threshold)
    ])

    test_suite.run(
        reference_data=reference_df,
        current_data=current_df,
        column_mapping=column_mapping
    )

    results = test_suite.as_dict()
    retraining_needed = not results['summary']['all_passed']

    return {
        'retraining_needed': retraining_needed,
        'drift_share': results['tests'][0]['result']['current'],
        'threshold': threshold
    }
```

### Performance Degradation Alert
```python
def check_performance_degradation(reference_df, current_df, column_mapping, min_accuracy=0.85):
    """Alert if classification accuracy drops below threshold."""
    from evidently.tests import TestAccuracyScore

    test_suite = TestSuite(tests=[
        TestAccuracyScore(gte=min_accuracy)
    ])

    test_suite.run(
        reference_data=reference_df,
        current_data=current_df,
        column_mapping=column_mapping
    )

    results = test_suite.as_dict()
    return {
        'degradation_detected': not results['summary']['all_passed'],
        'current_accuracy': results['tests'][0]['result']['current'],
        'threshold': min_accuracy
    }
```

## Best Practices

1. **Establish Baselines**: Use production data as reference, not training data
2. **Choose Appropriate Tests**: Match statistical tests to data types
3. **Set Meaningful Thresholds**: Balance sensitivity vs. alert fatigue
4. **Monitor Feature Importance**: Focus on high-impact features
5. **Time-Based Comparison**: Compare similar time periods
6. **Document Decisions**: Record why certain drift is acceptable

## References

- [Evidently AI Documentation](https://docs.evidentlyai.com/)
- [Evidently GitHub](https://github.com/evidentlyai/evidently)
- [ML Monitoring Course](https://evidentlyai.com/ml-in-production-course)
- [Evidently Blog](https://www.evidentlyai.com/blog)
