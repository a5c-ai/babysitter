---
name: jupyter-notebook-executor
description: Jupyter notebook execution skill for running notebooks programmatically and extracting outputs.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# jupyter-notebook-executor

## Overview

Jupyter notebook execution skill for running notebooks programmatically, parameterizing inputs, and extracting outputs for ML workflows.

## Capabilities

- Parameterized notebook execution
- Output extraction and validation
- Notebook conversion (to HTML/PDF)
- Cell execution control
- Error handling and reporting
- Environment management
- Kernel specification
- Timeout management

## Target Processes

- Exploratory Data Analysis (EDA) Pipeline
- Model Interpretability and Explainability Analysis
- Experiment Planning and Hypothesis Testing

## Tools and Libraries

- papermill
- nbconvert
- jupyter
- nbformat

## Input Schema

```json
{
  "type": "object",
  "required": ["action", "notebookPath"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["execute", "convert", "extract", "validate"],
      "description": "Action to perform on the notebook"
    },
    "notebookPath": {
      "type": "string",
      "description": "Path to the Jupyter notebook"
    },
    "executeConfig": {
      "type": "object",
      "properties": {
        "parameters": { "type": "object" },
        "outputPath": { "type": "string" },
        "kernel": { "type": "string" },
        "timeout": { "type": "integer" },
        "cwd": { "type": "string" }
      }
    },
    "convertConfig": {
      "type": "object",
      "properties": {
        "format": { "type": "string", "enum": ["html", "pdf", "markdown", "script"] },
        "outputPath": { "type": "string" },
        "template": { "type": "string" },
        "excludeInput": { "type": "boolean" },
        "excludeOutput": { "type": "boolean" }
      }
    },
    "extractConfig": {
      "type": "object",
      "properties": {
        "cellTags": { "type": "array", "items": { "type": "string" } },
        "outputTypes": { "type": "array", "items": { "type": "string" } },
        "variableNames": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "action"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error", "timeout"]
    },
    "action": {
      "type": "string"
    },
    "executionResult": {
      "type": "object",
      "properties": {
        "outputPath": { "type": "string" },
        "executionTime": { "type": "number" },
        "cellsExecuted": { "type": "integer" },
        "errors": { "type": "array" }
      }
    },
    "conversionResult": {
      "type": "object",
      "properties": {
        "outputPath": { "type": "string" },
        "format": { "type": "string" }
      }
    },
    "extractedData": {
      "type": "object",
      "properties": {
        "variables": { "type": "object" },
        "outputs": { "type": "array" },
        "figures": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Execute EDA notebook with parameters',
  skill: {
    name: 'jupyter-notebook-executor',
    context: {
      action: 'execute',
      notebookPath: 'notebooks/eda_template.ipynb',
      executeConfig: {
        parameters: {
          data_path: 'data/train.csv',
          output_dir: 'results/eda/',
          sample_size: 10000
        },
        outputPath: 'notebooks/eda_results.ipynb',
        kernel: 'python3',
        timeout: 3600
      }
    }
  }
}
```
