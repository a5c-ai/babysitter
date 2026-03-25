---
name: api-mock-server
description: Generate and run mock API servers from OpenAPI specifications
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# API Mock Server Skill

## Overview

Generates and runs mock API servers from OpenAPI specifications with dynamic response generation, request validation, and Prism/Mockoon integration.

## Capabilities

- Generate mock server from OpenAPI spec
- Dynamic response generation based on schemas
- Request validation against spec
- Prism and Mockoon integration
- Custom response scenarios
- Callback and webhook simulation
- Stateful mock behavior

## Target Processes

- api-design-specification
- microservices-decomposition

## Input Schema

```json
{
  "type": "object",
  "required": ["specPath"],
  "properties": {
    "specPath": {
      "type": "string",
      "description": "Path to OpenAPI specification"
    },
    "port": {
      "type": "number",
      "default": 4010
    },
    "engine": {
      "type": "string",
      "enum": ["prism", "mockoon", "custom"],
      "default": "prism"
    },
    "options": {
      "type": "object",
      "properties": {
        "dynamic": {
          "type": "boolean",
          "default": true,
          "description": "Generate dynamic responses"
        },
        "validateRequest": {
          "type": "boolean",
          "default": true
        },
        "cors": {
          "type": "boolean",
          "default": true
        },
        "scenarios": {
          "type": "array",
          "description": "Custom response scenarios"
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
    "serverUrl": {
      "type": "string"
    },
    "port": {
      "type": "number"
    },
    "endpoints": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "method": { "type": "string" },
          "path": { "type": "string" }
        }
      }
    },
    "pid": {
      "type": "number",
      "description": "Process ID of running server"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'api-mock-server',
    context: {
      specPath: 'api/openapi.yaml',
      port: 4010,
      engine: 'prism',
      options: {
        dynamic: true,
        validateRequest: true
      }
    }
  }
}
```
