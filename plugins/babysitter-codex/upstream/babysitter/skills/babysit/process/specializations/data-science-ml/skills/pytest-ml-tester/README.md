# pytest-ml-tester

ML-specific testing skill using pytest with fixtures for data, models, and predictions.

## Purpose

This skill provides comprehensive ML testing capabilities using pytest, enabling teams to write and run tests for data validation, model inference, performance regression, and integration testing.

## Key Features

- **ML Fixtures**: Specialized fixtures for data and models
- **Property-Based Testing**: Hypothesis integration for robust testing
- **Performance Tests**: Regression testing for inference latency
- **Coverage Reports**: Track test coverage for ML code
- **Test Generation**: Automatic test scaffolding

## When to Use

- Testing data validation pipelines
- Verifying model inference correctness
- Regression testing model performance
- Integration testing ML systems
- Ensuring code quality in ML projects

## Integration

Works seamlessly with:
- `great-expectations-validator` for data validation
- `sklearn-model-trainer` for model testing
- `bentoml-model-packager` for serving tests
- `mlflow-experiment-tracker` for experiment validation
