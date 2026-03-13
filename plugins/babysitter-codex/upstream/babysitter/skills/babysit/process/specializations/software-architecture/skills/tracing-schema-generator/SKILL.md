---
name: tracing-schema-generator
description: Generate distributed tracing schemas for OpenTelemetry with Jaeger/Zipkin integration
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Tracing Schema Generator Skill

## Overview

Generates OpenTelemetry tracing schemas including span attribute definitions, trace context propagation, and Jaeger/Zipkin integration configurations.

## Capabilities

- OpenTelemetry tracing schemas
- Span attribute definitions
- Trace context propagation (W3C, B3)
- Jaeger integration
- Zipkin integration
- Baggage propagation
- Sampling strategy configuration
- Span naming conventions

## Target Processes

- observability-implementation
- microservices-decomposition

## Input Schema

```json
{
  "type": "object",
  "required": ["services"],
  "properties": {
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "operations": { "type": "array" },
          "dependencies": { "type": "array" }
        }
      }
    },
    "propagation": {
      "type": "string",
      "enum": ["w3c", "b3", "jaeger"],
      "default": "w3c"
    },
    "backend": {
      "type": "string",
      "enum": ["jaeger", "zipkin", "tempo", "xray"],
      "default": "jaeger"
    },
    "options": {
      "type": "object",
      "properties": {
        "samplingRate": {
          "type": "number",
          "default": 0.1
        },
        "samplingStrategy": {
          "type": "string",
          "enum": ["always_on", "always_off", "trace_id_ratio", "parent_based"],
          "default": "trace_id_ratio"
        },
        "includeBaggage": {
          "type": "boolean",
          "default": true
        },
        "semanticConventions": {
          "type": "string",
          "enum": ["http", "db", "messaging", "rpc"],
          "default": "http"
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
    "spanDefinitions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "kind": { "type": "string" },
          "attributes": { "type": "array" },
          "events": { "type": "array" }
        }
      }
    },
    "propagationConfig": {
      "type": "object"
    },
    "samplerConfig": {
      "type": "object"
    },
    "exporterConfig": {
      "type": "object",
      "description": "Jaeger/Zipkin exporter configuration"
    },
    "instrumentation": {
      "type": "object",
      "description": "Auto-instrumentation configuration"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'tracing-schema-generator',
    context: {
      services: [
        {
          name: 'order-service',
          operations: ['createOrder', 'getOrder', 'updateOrder'],
          dependencies: ['inventory-service', 'payment-service']
        }
      ],
      propagation: 'w3c',
      backend: 'jaeger',
      options: {
        samplingRate: 0.1,
        samplingStrategy: 'trace_id_ratio'
      }
    }
  }
}
```
