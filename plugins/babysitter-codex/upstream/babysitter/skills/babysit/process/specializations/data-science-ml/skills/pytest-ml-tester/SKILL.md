---
name: pytest-ml-tester
description: ML-specific testing skill using pytest with fixtures for data, models, and predictions.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# pytest-ml-tester

## Overview

ML-specific testing skill using pytest with specialized fixtures for data validation, model loading, prediction testing, and ML pipeline verification.

## Capabilities

- Data validation fixtures
- Model loading fixtures
- Prediction testing utilities
- Performance regression tests
- Integration test helpers
- Coverage reporting for ML code
- Property-based testing with Hypothesis
- Parameterized test generation

## Target Processes

- ML System Integration Testing
- Model Evaluation and Validation Framework
- Data Collection and Validation Pipeline

## Tools and Libraries

- pytest
- pytest-cov
- hypothesis
- great-expectations (optional)

## Input Schema

```json
{
  "type": "object",
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["run", "generate", "coverage", "fixtures"],
      "description": "Testing action to perform"
    },
    "testConfig": {
      "type": "object",
      "properties": {
        "testPath": { "type": "string" },
        "markers": { "type": "array", "items": { "type": "string" } },
        "verbose": { "type": "boolean" },
        "failFast": { "type": "boolean" },
        "parallel": { "type": "integer" }
      }
    },
    "coverageConfig": {
      "type": "object",
      "properties": {
        "sourcePath": { "type": "string" },
        "minCoverage": { "type": "number" },
        "reportFormat": { "type": "string", "enum": ["html", "xml", "term"] }
      }
    },
    "generateConfig": {
      "type": "object",
      "properties": {
        "testType": {
          "type": "string",
          "enum": ["data_validation", "model_inference", "performance", "integration"]
        },
        "targetPath": { "type": "string" },
        "modelPath": { "type": "string" },
        "dataPath": { "type": "string" }
      }
    },
    "fixtureConfig": {
      "type": "object",
      "properties": {
        "dataFixtures": { "type": "array" },
        "modelFixtures": { "type": "array" },
        "scope": { "type": "string", "enum": ["function", "class", "module", "session"] }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["status", "results"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["passed", "failed", "error"]
    },
    "results": {
      "type": "object",
      "properties": {
        "totalTests": { "type": "integer" },
        "passed": { "type": "integer" },
        "failed": { "type": "integer" },
        "skipped": { "type": "integer" },
        "duration": { "type": "number" }
      }
    },
    "failures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "testName": { "type": "string" },
          "error": { "type": "string" },
          "traceback": { "type": "string" }
        }
      }
    },
    "coverage": {
      "type": "object",
      "properties": {
        "percentage": { "type": "number" },
        "reportPath": { "type": "string" },
        "uncoveredLines": { "type": "object" }
      }
    },
    "generatedTests": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  title: 'Run ML integration tests',
  skill: {
    name: 'pytest-ml-tester',
    context: {
      action: 'run',
      testConfig: {
        testPath: 'tests/integration/',
        markers: ['integration', 'model'],
        verbose: true,
        parallel: 4
      },
      coverageConfig: {
        sourcePath: 'src/',
        minCoverage: 80,
        reportFormat: 'html'
      }
    }
  }
}
```
