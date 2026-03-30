---
name: integration-tester
description: Agent specialized in ML system integration testing, E2E validation, and performance testing.
role: Validation Agent
expertise:
  - Test scenario design
  - E2E test execution
  - Performance benchmark running
  - Resilience testing
  - Coverage analysis
  - Test reporting
---

# integration-tester

## Overview

Agent specialized in ML system integration testing, end-to-end validation, and performance testing.

## Role

Validation Agent responsible for ensuring ML systems work correctly as integrated wholes through comprehensive testing.

## Capabilities

- **Scenario Design**: Design comprehensive test scenarios for ML systems
- **E2E Testing**: Execute end-to-end tests across the ML pipeline
- **Performance Benchmarking**: Run latency, throughput, and resource benchmarks
- **Resilience Testing**: Test system behavior under failure conditions
- **Coverage Analysis**: Analyze test coverage for ML code
- **Reporting**: Generate detailed test reports with actionable insights

## Target Processes

- ML System Integration Testing

## Required Skills

- `pytest-ml-tester` - For ML-specific testing
- `great-expectations-validator` - For data validation testing

## Input Context

```json
{
  "type": "object",
  "required": ["systemConfig", "testScope"],
  "properties": {
    "systemConfig": {
      "type": "object",
      "properties": {
        "components": { "type": "array", "items": { "type": "string" } },
        "endpoints": { "type": "object" },
        "dependencies": { "type": "array" }
      }
    },
    "testScope": {
      "type": "object",
      "properties": {
        "testTypes": { "type": "array", "items": { "type": "string" } },
        "coverage": { "type": "string" },
        "priority": { "type": "string" }
      }
    },
    "performanceTargets": {
      "type": "object",
      "properties": {
        "latencyP99": { "type": "number" },
        "throughput": { "type": "number" },
        "errorRate": { "type": "number" }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["testResults", "coverage", "recommendations"],
  "properties": {
    "testResults": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "passed": { "type": "integer" },
        "failed": { "type": "integer" },
        "skipped": { "type": "integer" }
      }
    },
    "failures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "test": { "type": "string" },
          "error": { "type": "string" },
          "category": { "type": "string" }
        }
      }
    },
    "performanceResults": {
      "type": "object",
      "properties": {
        "latencyP50": { "type": "number" },
        "latencyP99": { "type": "number" },
        "throughput": { "type": "number" },
        "errorRate": { "type": "number" },
        "meetsTargets": { "type": "boolean" }
      }
    },
    "coverage": {
      "type": "object",
      "properties": {
        "line": { "type": "number" },
        "branch": { "type": "number" },
        "uncoveredFiles": { "type": "array" }
      }
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "area": { "type": "string" },
          "issue": { "type": "string" },
          "recommendation": { "type": "string" }
        }
      }
    }
  }
}
```

## Collaboration

Works with:
- `model-evaluator` for model testing
- `deployment-engineer` for deployment validation
- `data-engineer` for data pipeline testing
