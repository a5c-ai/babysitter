# jupyter-notebook-executor

Jupyter notebook execution skill for running notebooks programmatically and extracting outputs.

## Purpose

This skill provides programmatic notebook execution capabilities using papermill and nbconvert, enabling teams to automate notebook-based workflows, parameterize analyses, and extract results.

## Key Features

- **Parameterized Execution**: Run notebooks with different inputs
- **Output Extraction**: Extract variables, figures, and outputs
- **Format Conversion**: Convert to HTML, PDF, Markdown
- **Error Handling**: Graceful handling of cell failures
- **Timeout Management**: Control execution time limits

## When to Use

- Automating EDA notebooks in pipelines
- Generating parameterized reports
- Extracting results from analysis notebooks
- Converting notebooks for documentation
- Running notebook-based experiments

## Integration

Works seamlessly with:
- `pandas-dataframe-analyzer` for data analysis
- `mlflow-experiment-tracker` for experiment tracking
- `wandb-experiment-tracker` for visualization
- `great-expectations-validator` for data validation
