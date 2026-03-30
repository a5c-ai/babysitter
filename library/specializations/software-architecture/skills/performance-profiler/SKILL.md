---
name: performance-profiler
description: Profile application performance including CPU, memory, and flame graph generation
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Performance Profiler Skill

## Overview

Profiles application performance including CPU profiling, memory profiling, flame graph generation, bottleneck identification, and APM tool integration.

## Capabilities

- CPU profiling
- Memory profiling and heap snapshots
- Flame graph generation
- Bottleneck identification
- Hot path analysis
- Integration with APM tools (DataDog, New Relic)
- Event loop analysis (Node.js)
- Garbage collection analysis

## Target Processes

- performance-optimization

## Input Schema

```json
{
  "type": "object",
  "required": ["target"],
  "properties": {
    "target": {
      "type": "string",
      "description": "Target process, script, or endpoint"
    },
    "mode": {
      "type": "string",
      "enum": ["cpu", "memory", "heap", "all"],
      "default": "cpu"
    },
    "duration": {
      "type": "number",
      "default": 30,
      "description": "Profiling duration in seconds"
    },
    "options": {
      "type": "object",
      "properties": {
        "samplingInterval": {
          "type": "number",
          "default": 1000,
          "description": "Sampling interval in microseconds"
        },
        "generateFlameGraph": {
          "type": "boolean",
          "default": true
        },
        "outputFormat": {
          "type": "string",
          "enum": ["json", "html", "svg"],
          "default": "html"
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
    "profile": {
      "type": "object",
      "properties": {
        "duration": { "type": "number" },
        "samples": { "type": "number" }
      }
    },
    "hotspots": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "function": { "type": "string" },
          "selfTime": { "type": "number" },
          "totalTime": { "type": "number" },
          "percentage": { "type": "number" }
        }
      }
    },
    "flameGraphPath": {
      "type": "string"
    },
    "memoryStats": {
      "type": "object",
      "properties": {
        "heapUsed": { "type": "number" },
        "heapTotal": { "type": "number" },
        "external": { "type": "number" }
      }
    },
    "recommendations": {
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
  skill: {
    name: 'performance-profiler',
    context: {
      target: 'npm run start',
      mode: 'cpu',
      duration: 30,
      options: {
        generateFlameGraph: true,
        outputFormat: 'html'
      }
    }
  }
}
```
