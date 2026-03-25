---
name: pandas-dataframe-analyzer
description: Automated DataFrame analysis skill for statistical summaries, missing value detection, data type inference, and memory optimization recommendations.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# pandas-dataframe-analyzer

## Overview

Automated DataFrame analysis skill for statistical summaries, missing value detection, data type inference, and memory optimization recommendations using pandas and profiling libraries.

## Capabilities

- Statistical profiling of DataFrames
- Missing value pattern detection
- Data type optimization suggestions
- Memory footprint analysis
- Duplicate detection and handling
- Distribution analysis and visualization
- Correlation matrix computation
- Cardinality analysis for categorical features

## Target Processes

- Exploratory Data Analysis (EDA) Pipeline
- Data Collection and Validation Pipeline
- Feature Engineering Design and Implementation

## Tools and Libraries

- pandas
- pandas-profiling / ydata-profiling
- numpy
- scipy (for statistical tests)

## Input Schema

```json
{
  "type": "object",
  "required": ["dataPath"],
  "properties": {
    "dataPath": {
      "type": "string",
      "description": "Path to the data file (CSV, Parquet, JSON)"
    },
    "sampleSize": {
      "type": "integer",
      "description": "Number of rows to sample for analysis",
      "default": 10000
    },
    "profileType": {
      "type": "string",
      "enum": ["minimal", "standard", "full"],
      "default": "standard"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["json", "html", "markdown"],
      "default": "json"
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["summary", "columns", "recommendations"],
  "properties": {
    "summary": {
      "type": "object",
      "properties": {
        "rowCount": { "type": "integer" },
        "columnCount": { "type": "integer" },
        "memoryUsageMB": { "type": "number" },
        "duplicateRows": { "type": "integer" },
        "missingCells": { "type": "integer" },
        "missingCellsPercent": { "type": "number" }
      }
    },
    "columns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "dtype": { "type": "string" },
          "nullCount": { "type": "integer" },
          "uniqueCount": { "type": "integer" },
          "stats": { "type": "object" }
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "column": { "type": "string" },
          "suggestion": { "type": "string" },
          "impact": { "type": "string" }
        }
      }
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Analyze training dataset',
  skill: {
    name: 'pandas-dataframe-analyzer',
    context: {
      dataPath: 'data/train.csv',
      profileType: 'full',
      outputFormat: 'json'
    }
  }
}
```
