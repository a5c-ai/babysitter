---
name: dvc-dataset-versioning
description: Dataset versioning skill using DVC for tracking data changes, managing data pipelines, and ensuring reproducibility.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# dvc-dataset-versioning

## Overview

Dataset versioning skill using DVC (Data Version Control) for tracking data changes, managing data pipelines, and ensuring reproducibility in ML workflows.

## Capabilities

- Dataset version tracking
- Data pipeline definition and execution
- Remote storage management (S3, GCS, Azure, etc.)
- Reproducibility enforcement
- Data lineage tracking
- Experiment comparison with data versions
- Cache management for large datasets

## Target Processes

- Data Collection and Validation Pipeline
- ML Model Retraining Pipeline
- Feature Store Implementation

## Tools and Libraries

- DVC
- Git
- Remote storage SDKs (boto3, google-cloud-storage, etc.)

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["init", "add", "push", "pull", "diff", "checkout", "run", "repro"],
      "description": "DVC action to perform"
    },
    "paths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "File or directory paths to track"
    },
    "remote": {
      "type": "string",
      "description": "Remote storage name"
    },
    "revision": {
      "type": "string",
      "description": "Git revision for checkout/diff"
    },
    "pipeline": {
      "type": "object",
      "description": "Pipeline stage definition for run action"
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
      "enum": ["success", "error"]
    },
    "action": {
      "type": "string"
    },
    "trackedFiles": {
      "type": "array",
      "items": { "type": "string" }
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "status": { "type": "string" },
          "hash": { "type": "string" }
        }
      }
    },
    "remote": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "url": { "type": "string" },
        "syncStatus": { "type": "string" }
      }
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Version training dataset',
  skill: {
    name: 'dvc-dataset-versioning',
    context: {
      action: 'add',
      paths: ['data/train.csv', 'data/test.csv'],
      remote: 's3-bucket'
    }
  }
}
```
