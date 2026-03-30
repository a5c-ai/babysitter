---
name: load-test-generator
description: Generate load test scripts for k6, Locust, and Gatling from OpenAPI specs
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Load Test Generator Skill

## Overview

Generates load test scripts for k6, Locust, and Gatling including test scenarios from OpenAPI specifications and performance validation patterns.

## Capabilities

- Generate k6 load test scripts
- Locust test generation
- Gatling scenario creation
- Test scenario from OpenAPI spec
- Ramp-up/ramp-down patterns
- Think time configuration
- Virtual user modeling
- Threshold configuration

## Target Processes

- performance-optimization
- resilience-patterns
- migration-strategy

## Input Schema

```json
{
  "type": "object",
  "required": ["scenarios"],
  "properties": {
    "scenarios": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "endpoints": { "type": "array" },
          "load": {
            "type": "object",
            "properties": {
              "vus": { "type": "number" },
              "duration": { "type": "string" },
              "rampUp": { "type": "string" }
            }
          }
        }
      }
    },
    "framework": {
      "type": "string",
      "enum": ["k6", "locust", "gatling", "artillery"],
      "default": "k6"
    },
    "openapiSpec": {
      "type": "string",
      "description": "Path to OpenAPI spec for auto-generation"
    },
    "options": {
      "type": "object",
      "properties": {
        "thresholds": {
          "type": "object",
          "properties": {
            "p95ResponseTime": { "type": "number" },
            "errorRate": { "type": "number" }
          }
        },
        "thinkTime": {
          "type": "object",
          "properties": {
            "min": { "type": "number" },
            "max": { "type": "number" }
          }
        },
        "dataFile": {
          "type": "string",
          "description": "Path to test data CSV"
        }
      }
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "scripts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "path": { "type": "string" },
          "framework": { "type": "string" }
        }
      }
    },
    "configFile": {
      "type": "string"
    },
    "runCommand": {
      "type": "string"
    },
    "thresholds": {
      "type": "object"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'load-test-generator',
    context: {
      scenarios: [
        {
          name: 'smoke-test',
          endpoints: ['/api/health', '/api/users'],
          load: { vus: 10, duration: '1m', rampUp: '10s' }
        }
      ],
      framework: 'k6',
      options: {
        thresholds: {
          p95ResponseTime: 500,
          errorRate: 0.01
        }
      }
    }
  }
}
```
