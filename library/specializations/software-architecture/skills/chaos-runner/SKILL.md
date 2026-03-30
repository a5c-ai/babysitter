---
name: chaos-runner
description: Run chaos engineering experiments using Chaos Monkey, Litmus, or Gremlin
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Chaos Engineering Runner Skill

## Overview

Runs chaos engineering experiments using Chaos Monkey, Litmus, or Gremlin including failure injection scenarios, blast radius control, and experiment analysis.

## Capabilities

- Run Chaos Monkey experiments
- Litmus chaos execution
- Gremlin integration
- Failure injection scenarios
- Blast radius control
- Steady state validation
- Experiment rollback
- Results analysis

## Target Processes

- resilience-patterns

## Input Schema

```json
{
  "type": "object",
  "required": ["experiment"],
  "properties": {
    "experiment": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "type": {
          "type": "string",
          "enum": ["pod-kill", "network-latency", "cpu-stress", "memory-stress", "disk-fill", "node-drain"]
        },
        "target": {
          "type": "object",
          "properties": {
            "namespace": { "type": "string" },
            "labelSelector": { "type": "object" },
            "percentage": { "type": "number" }
          }
        },
        "duration": { "type": "string" }
      }
    },
    "framework": {
      "type": "string",
      "enum": ["litmus", "gremlin", "chaos-monkey", "toxiproxy"],
      "default": "litmus"
    },
    "steadyState": {
      "type": "object",
      "properties": {
        "probes": { "type": "array" },
        "assertions": { "type": "array" }
      }
    },
    "options": {
      "type": "object",
      "properties": {
        "dryRun": {
          "type": "boolean",
          "default": true
        },
        "autoRollback": {
          "type": "boolean",
          "default": true
        },
        "notifyOnFailure": {
          "type": "boolean",
          "default": true
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
    "experimentId": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": ["passed", "failed", "aborted"]
    },
    "steadyStateValidation": {
      "type": "object",
      "properties": {
        "before": { "type": "boolean" },
        "during": { "type": "boolean" },
        "after": { "type": "boolean" }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "affectedPods": { "type": "number" },
        "recoveryTime": { "type": "string" },
        "errorRate": { "type": "number" }
      }
    },
    "findings": {
      "type": "array"
    },
    "recommendations": {
      "type": "array"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'chaos-runner',
    context: {
      experiment: {
        name: 'pod-failure-test',
        type: 'pod-kill',
        target: {
          namespace: 'production',
          labelSelector: { app: 'api-service' },
          percentage: 50
        },
        duration: '5m'
      },
      framework: 'litmus',
      steadyState: {
        probes: [{ type: 'http', endpoint: '/health' }],
        assertions: [{ metric: 'error_rate', operator: '<', value: 0.01 }]
      },
      options: {
        dryRun: false,
        autoRollback: true
      }
    }
  }
}
```
