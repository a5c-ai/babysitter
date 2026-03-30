# Great Expectations Validator Skill

## Overview

The Great Expectations Validator skill provides comprehensive data quality validation capabilities using Great Expectations (GX), the leading open-source data validation framework. This skill enables automated data quality checks, documentation generation, and integration with ML pipelines.

## Purpose

Data quality is fundamental to ML success. Great Expectations provides a declarative, human-readable approach to defining data expectations and validating data against them. This skill enables:

- **Automated Data Validation**: Validate data automatically in pipelines
- **Data Documentation**: Generate rich data documentation
- **Quality Monitoring**: Track data quality over time
- **Pipeline Integration**: Integrate validation into ML workflows

## Use Cases

### 1. Training Data Validation
Ensure training data meets quality requirements before model training.

### 2. Feature Quality Checks
Validate engineered features for consistency and correctness.

### 3. Data Pipeline Testing
Validate data at each stage of ETL/ELT pipelines.

### 4. Production Data Monitoring
Monitor incoming production data for drift and quality issues.

## Processes That Use This Skill

- **Data Collection and Validation Pipeline** (`data-collection-validation.js`)
- **Exploratory Data Analysis (EDA) Pipeline** (`eda-pipeline.js`)
- **ML System Integration Testing** (`ml-integration-testing.js`)
- **Feature Store Implementation** (`feature-store.js`)

## Installation

```bash
# Core installation
pip install great_expectations>=0.18.0

# Database connectors
pip install great_expectations[sqlalchemy]

# Cloud storage support
pip install great_expectations[s3,gcs,azure]

# Spark support
pip install great_expectations[spark]
```

## Quick Start

### 1. Initialize Project

```bash
# Create GX project structure
great_expectations init
```

This creates:
```
great_expectations/
├── great_expectations.yml    # Main configuration
├── expectations/             # Expectation suites
├── checkpoints/              # Checkpoint configurations
├── plugins/                  # Custom expectations
└── uncommitted/              # Local-only files
    └── data_docs/            # Generated documentation
```

### 2. Configure Datasource

```python
import great_expectations as gx

context = gx.get_context()

# Add pandas datasource
datasource = context.sources.add_pandas("my_pandas_datasource")

# Add CSV data asset
csv_asset = datasource.add_csv_asset(
    "my_csv_data",
    filepath_or_buffer="path/to/data.csv"
)

# Or add database datasource
db_datasource = context.sources.add_sql(
    "my_database",
    connection_string="postgresql://user:pass@host:5432/db"
)

table_asset = db_datasource.add_table_asset("users", table_name="users")
```

### 3. Create Expectation Suite

```python
# Create suite
context.add_or_update_expectation_suite("my_data_suite")

# Get validator
batch_request = csv_asset.build_batch_request()
validator = context.get_validator(
    batch_request=batch_request,
    expectation_suite_name="my_data_suite"
)

# Add expectations
validator.expect_column_to_exist("id")
validator.expect_column_values_to_be_unique("id")
validator.expect_column_values_to_not_be_null("id")

validator.expect_column_to_exist("email")
validator.expect_column_values_to_match_regex(
    "email",
    r"^[\w\.-]+@[\w\.-]+\.\w+$"
)

validator.expect_column_to_exist("age")
validator.expect_column_values_to_be_between("age", min_value=0, max_value=150)

# Save suite
validator.save_expectation_suite()
```

### 4. Run Validation

```python
# Create checkpoint
checkpoint = context.add_or_update_checkpoint(
    name="my_checkpoint",
    validations=[{
        "batch_request": {
            "datasource_name": "my_pandas_datasource",
            "data_asset_name": "my_csv_data"
        },
        "expectation_suite_name": "my_data_suite"
    }]
)

# Run validation
result = checkpoint.run()

# Check results
print(f"Validation success: {result.success}")
print(f"Evaluated expectations: {result.statistics['evaluated_expectations']}")
print(f"Successful: {result.statistics['successful_expectations']}")
print(f"Failed: {result.statistics['unsuccessful_expectations']}")
```

## Common Expectation Types

### Column Existence and Types

| Expectation | Purpose |
|-------------|---------|
| `expect_column_to_exist` | Column must exist |
| `expect_table_columns_to_match_set` | All columns present |
| `expect_table_column_count_to_equal` | Exact column count |
| `expect_column_values_to_be_of_type` | Column data type |

### Null and Uniqueness

| Expectation | Purpose |
|-------------|---------|
| `expect_column_values_to_not_be_null` | No nulls (or mostly) |
| `expect_column_values_to_be_null` | All nulls |
| `expect_column_values_to_be_unique` | Unique values |
| `expect_compound_columns_to_be_unique` | Composite key unique |

### Value Constraints

| Expectation | Purpose |
|-------------|---------|
| `expect_column_values_to_be_between` | Numeric range |
| `expect_column_values_to_be_in_set` | Categorical values |
| `expect_column_values_to_match_regex` | String pattern |
| `expect_column_value_lengths_to_be_between` | String length |

### Statistical

| Expectation | Purpose |
|-------------|---------|
| `expect_column_mean_to_be_between` | Mean in range |
| `expect_column_stdev_to_be_between` | Standard deviation |
| `expect_column_median_to_be_between` | Median in range |
| `expect_column_quantile_values_to_be_between` | Quantile values |

## MCP Server Integration

The `gx-mcp-server` provides LLM access to Great Expectations:

```json
{
  "mcpServers": {
    "great-expectations": {
      "command": "uvx",
      "args": ["gx-mcp-server"],
      "env": {
        "GX_CONTEXT_ROOT": "./great_expectations"
      }
    }
  }
}
```

Available tools:
- List datasources and expectation suites
- Run checkpoints and validations
- Retrieve validation results
- Generate data documentation

## ML Pipeline Integration

### Pre-Training Validation

```python
def validate_before_training(X_train, y_train, suite_name="training_suite"):
    """Gate training on data quality."""
    import pandas as pd

    # Combine features and target
    df = X_train.copy()
    df['target'] = y_train

    context = gx.get_context()

    # Create datasource for this dataframe
    datasource = context.sources.add_or_update_pandas("training_validation")
    asset = datasource.add_dataframe_asset("training_data")
    batch = asset.build_batch_request(dataframe=df)

    # Validate
    result = context.run_checkpoint(
        checkpoint_name="training_checkpoint",
        batch_request=batch
    )

    if not result.success:
        raise ValueError("Training data validation failed!")

    return True
```

### Feature Store Validation

```python
def validate_features(feature_df, feature_group_name):
    """Validate features before storing in feature store."""
    suite_name = f"{feature_group_name}_expectations"

    context = gx.get_context()

    # Load or create suite
    if suite_name not in context.list_expectation_suite_names():
        # Profile and create expectations
        profiler = UserConfigurableProfiler(...)
        suite = profiler.build_suite()

    # Validate
    result = validate_dataframe(feature_df, suite_name)

    if not result.success:
        log_validation_failure(result)
        raise FeatureQualityError(f"Features failed validation: {feature_group_name}")

    return True
```

## Best Practices

### 1. Organize Expectation Suites

```
expectations/
├── raw_data/
│   ├── customers_raw.json
│   └── orders_raw.json
├── processed_data/
│   ├── customers_clean.json
│   └── orders_clean.json
└── features/
    ├── customer_features.json
    └── order_features.json
```

### 2. Use `mostly` for Flexibility

```python
# Allow 5% missing values
validator.expect_column_values_to_not_be_null("email", mostly=0.95)

# Allow some outliers
validator.expect_column_values_to_be_between("age", min_value=0, max_value=120, mostly=0.99)
```

### 3. Version Control Suites

```bash
# Add to git
git add great_expectations/expectations/
git commit -m "Add customer data expectations"
```

### 4. Generate Data Docs

```python
# Build docs
context.build_data_docs()

# Open in browser
context.open_data_docs()
```

## Troubleshooting

### Common Issues

1. **Context Not Found**: Ensure you're in the correct directory
2. **Datasource Errors**: Check connection strings and file paths
3. **Slow Validation**: Use sampling for large datasets
4. **Memory Issues**: Validate in batches

### Debug Commands

```bash
# Check GX version
great_expectations --version

# Validate configuration
great_expectations checkpoint run my_checkpoint

# List resources
great_expectations suite list
great_expectations datasource list
great_expectations checkpoint list
```

## Integration with Other Skills

- **pandas-dataframe-analyzer**: Profile data before creating expectations
- **evidently-drift-detector**: Combine quality checks with drift detection
- **mlflow-experiment-tracker**: Log validation results as artifacts
- **dvc-dataset-versioning**: Version data alongside expectations

## References

- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [GX MCP Server](https://github.com/davidf9999/gx-mcp-server)
- [Expectation Gallery](https://greatexpectations.io/expectations/)
- [GX Cloud](https://greatexpectations.io/cloud/)
- [GX GitHub](https://github.com/great-expectations/great_expectations)
