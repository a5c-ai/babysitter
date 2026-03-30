# pandas-dataframe-analyzer

Automated DataFrame analysis skill for statistical summaries, missing value detection, data type inference, and memory optimization recommendations.

## Purpose

This skill provides comprehensive analysis of pandas DataFrames to support exploratory data analysis (EDA) and data quality assessment workflows. It generates statistical profiles, identifies data quality issues, and provides actionable recommendations for data optimization.

## Key Features

- **Statistical Profiling**: Computes descriptive statistics, distributions, and correlations
- **Missing Value Analysis**: Detects patterns in missing data and suggests imputation strategies
- **Data Type Optimization**: Recommends optimal dtypes to reduce memory footprint
- **Duplicate Detection**: Identifies duplicate rows and suggests deduplication strategies
- **Quality Scoring**: Provides overall data quality scores and metrics

## When to Use

- Starting a new ML project to understand the data landscape
- Validating data quality before model training
- Identifying features that need preprocessing or transformation
- Optimizing memory usage for large datasets
- Generating data documentation for stakeholders

## Integration

Works seamlessly with:
- `great-expectations-validator` for data validation
- `feast-feature-store` for feature engineering
- `dvc-dataset-versioning` for data versioning
