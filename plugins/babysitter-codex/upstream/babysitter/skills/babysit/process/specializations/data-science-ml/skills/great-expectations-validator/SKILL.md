---
name: great-expectations-validator
description: Data quality validation skill using Great Expectations for schema validation, expectation suites, data documentation, and automated data quality checks in ML pipelines.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# Great Expectations Validator

Validate data quality using Great Expectations for comprehensive data testing, documentation, and quality monitoring.

## Overview

This skill provides capabilities for data quality validation using Great Expectations (GX), the leading open-source library for data quality. It enables creation and execution of expectation suites, data documentation generation, and integration with ML pipelines.

## Capabilities

### Expectation Suite Management
- Create and configure expectation suites
- Define expectations for columns and tables
- Validate data against expectations
- Store and version expectation suites

### Data Validation
- Schema validation (column presence, types)
- Statistical validation (distributions, ranges)
- Referential integrity checks
- Custom SQL-based expectations
- Regex pattern matching

### Data Documentation
- Generate data documentation (Data Docs)
- Create profiling reports
- Document validation results
- Build data dictionaries

### Pipeline Integration
- Checkpoint configuration and execution
- Batch request management
- Action-based workflows (notifications, storage)
- Integration with Airflow, Prefect, Dagster

### Custom Expectations
- Define domain-specific expectations
- Parameterized expectations
- Multi-column expectations
- Row-condition based expectations

## Prerequisites

### Installation
```bash
pip install great_expectations>=0.18.0
```

### Optional Connectors
```bash
# Database connectors
pip install great_expectations[sqlalchemy]

# Cloud storage
pip install great_expectations[s3]  # AWS
pip install great_expectations[gcs]  # GCP
pip install great_expectations[azure]  # Azure

# Spark support
pip install great_expectations[spark]
```

## Usage Patterns

### Initialize Great Expectations Project
```bash
# Initialize GX project
great_expectations init

# Creates:
# great_expectations/
# ├── great_expectations.yml
# ├── expectations/
# ├── checkpoints/
# ├── plugins/
# └── uncommitted/
```

### Create Expectation Suite from Profiler
```python
import great_expectations as gx

# Initialize context
context = gx.get_context()

# Add datasource
datasource = context.sources.add_pandas("my_datasource")
data_asset = datasource.add_csv_asset("customers", filepath_or_buffer="customers.csv")

# Create batch request
batch_request = data_asset.build_batch_request()

# Create expectation suite with profiler
expectation_suite = context.add_or_update_expectation_suite("customer_suite")

validator = context.get_validator(
    batch_request=batch_request,
    expectation_suite_name="customer_suite"
)

# Profile and generate expectations
validator.expect_column_to_exist("customer_id")
validator.expect_column_values_to_be_unique("customer_id")
validator.expect_column_values_to_not_be_null("customer_id")
validator.expect_column_values_to_be_between("age", min_value=0, max_value=120)
validator.expect_column_values_to_be_in_set("status", ["active", "inactive", "pending"])
validator.expect_column_values_to_match_regex("email", r"^[\w\.-]+@[\w\.-]+\.\w+$")

# Save suite
validator.save_expectation_suite(discard_failed_expectations=False)
```

### Validate Data with Checkpoint
```python
import great_expectations as gx

context = gx.get_context()

# Create checkpoint
checkpoint = context.add_or_update_checkpoint(
    name="customer_checkpoint",
    validations=[
        {
            "batch_request": {
                "datasource_name": "my_datasource",
                "data_asset_name": "customers"
            },
            "expectation_suite_name": "customer_suite"
        }
    ],
    action_list=[
        {
            "name": "store_validation_result",
            "action": {"class_name": "StoreValidationResultAction"}
        },
        {
            "name": "update_data_docs",
            "action": {"class_name": "UpdateDataDocsAction"}
        }
    ]
)

# Run checkpoint
result = checkpoint.run()

# Check results
if result.success:
    print("Validation passed!")
else:
    print("Validation failed!")
    for validation_result in result.run_results.values():
        for result in validation_result.results:
            if not result.success:
                print(f"Failed: {result.expectation_config.expectation_type}")
```

### Common Expectations
```python
# Column existence and types
validator.expect_column_to_exist("column_name")
validator.expect_column_values_to_be_of_type("column_name", "int64")
validator.expect_table_column_count_to_equal(10)

# Null handling
validator.expect_column_values_to_not_be_null("column_name")
validator.expect_column_values_to_be_null("deprecated_column")

# Uniqueness
validator.expect_column_values_to_be_unique("id_column")
validator.expect_compound_columns_to_be_unique(["col1", "col2"])

# Value ranges
validator.expect_column_values_to_be_between("age", min_value=0, max_value=120)
validator.expect_column_min_to_be_between("score", min_value=0)
validator.expect_column_max_to_be_between("score", max_value=100)

# Set membership
validator.expect_column_values_to_be_in_set("status", ["A", "B", "C"])
validator.expect_column_distinct_values_to_be_in_set("category", ["cat1", "cat2"])

# String patterns
validator.expect_column_values_to_match_regex("email", r"^[\w\.-]+@[\w\.-]+\.\w+$")
validator.expect_column_value_lengths_to_be_between("code", min_value=5, max_value=10)

# Statistical
validator.expect_column_mean_to_be_between("value", min_value=50, max_value=100)
validator.expect_column_stdev_to_be_between("value", min_value=0, max_value=20)
validator.expect_column_proportion_of_unique_values_to_be_between("id", min_value=0.9)
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const dataValidationTask = defineTask({
  name: 'great-expectations-validation',
  description: 'Validate data quality using Great Expectations',

  inputs: {
    dataPath: { type: 'string', required: true },
    expectationSuiteName: { type: 'string', required: true },
    checkpointName: { type: 'string' },
    failOnError: { type: 'boolean', default: true }
  },

  outputs: {
    success: { type: 'boolean' },
    validationResults: { type: 'object' },
    failedExpectations: { type: 'array' },
    dataDocsUrl: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Validate data: ${inputs.expectationSuiteName}`,
      skill: {
        name: 'great-expectations-validator',
        context: {
          operation: 'validate',
          dataPath: inputs.dataPath,
          expectationSuiteName: inputs.expectationSuiteName,
          checkpointName: inputs.checkpointName,
          failOnError: inputs.failOnError
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

## MCP Server Integration

### Using gx-mcp-server
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

### Available MCP Tools
- `gx_list_datasources` - List configured datasources
- `gx_list_expectation_suites` - List expectation suites
- `gx_run_checkpoint` - Execute a checkpoint
- `gx_validate_data` - Validate data against suite
- `gx_get_validation_results` - Retrieve validation results

## ML Pipeline Integration

### Training Data Validation
```python
def validate_training_data(df, suite_name="training_data_suite"):
    """Validate training data before model training."""
    context = gx.get_context()

    # Add dataframe as datasource
    datasource = context.sources.add_pandas("training_data")
    data_asset = datasource.add_dataframe_asset("df")
    batch_request = data_asset.build_batch_request(dataframe=df)

    # Validate
    checkpoint = context.add_or_update_checkpoint(
        name="training_validation",
        validations=[{
            "batch_request": batch_request,
            "expectation_suite_name": suite_name
        }]
    )

    result = checkpoint.run()

    if not result.success:
        failed = [r for r in result.run_results.values()
                  for r in r.results if not r.success]
        raise ValueError(f"Training data validation failed: {len(failed)} expectations failed")

    return True
```

### Feature Quality Checks
```python
# Expectations for ML features
validator.expect_column_values_to_not_be_null("feature_1", mostly=0.95)
validator.expect_column_values_to_be_between("feature_1", min_value=-3, max_value=3)  # Standard scaled
validator.expect_column_proportion_of_unique_values_to_be_between("categorical_feature", min_value=0.001)
validator.expect_column_kl_divergence_to_be_less_than("feature_1",
    partition_object=reference_distribution,
    threshold=0.1)
```

## Best Practices

1. **Version Expectation Suites**: Store suites in version control
2. **Use Checkpoints**: Always validate through checkpoints for consistency
3. **Set Mostly Parameter**: Allow for small data quality issues with `mostly=0.95`
4. **Generate Data Docs**: Document your data for team visibility
5. **Fail Fast**: Validate data early in pipelines
6. **Custom Expectations**: Create domain-specific expectations for your use case

## References

- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [GX MCP Server](https://github.com/davidf9999/gx-mcp-server)
- [Expectation Gallery](https://greatexpectations.io/expectations/)
- [GX Cloud](https://greatexpectations.io/cloud/)
