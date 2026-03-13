---
name: log-schema-generator
description: Generate structured logging schemas with correlation ID patterns and ELK/Splunk integration
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Log Schema Generator Skill

## Overview

Generates structured logging schema definitions including log level standards, correlation ID patterns, and ELK/Splunk integration templates.

## Capabilities

- Structured logging schema definition
- Log level standards (RFC 5424)
- Correlation ID patterns
- ELK Stack integration templates
- Splunk integration templates
- Log format standardization (JSON, logfmt)
- Context propagation patterns
- PII masking rules

## Target Processes

- observability-implementation

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
          "language": { "type": "string" },
          "framework": { "type": "string" }
        }
      }
    },
    "format": {
      "type": "string",
      "enum": ["json", "logfmt", "ecs"],
      "default": "json"
    },
    "integration": {
      "type": "string",
      "enum": ["elk", "splunk", "datadog", "cloudwatch"],
      "default": "elk"
    },
    "options": {
      "type": "object",
      "properties": {
        "includeCorrelationId": {
          "type": "boolean",
          "default": true
        },
        "includePiiMasking": {
          "type": "boolean",
          "default": true
        },
        "logLevels": {
          "type": "array",
          "default": ["debug", "info", "warn", "error", "fatal"]
        },
        "requiredFields": {
          "type": "array",
          "default": ["timestamp", "level", "message", "service"]
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
    "schema": {
      "type": "object",
      "properties": {
        "fields": { "type": "array" },
        "requiredFields": { "type": "array" },
        "format": { "type": "string" }
      }
    },
    "correlationIdPattern": {
      "type": "object",
      "properties": {
        "headerName": { "type": "string" },
        "format": { "type": "string" },
        "propagation": { "type": "string" }
      }
    },
    "integrationConfig": {
      "type": "object",
      "description": "ELK/Splunk configuration"
    },
    "piiMaskingRules": {
      "type": "array"
    },
    "exampleLogs": {
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
    name: 'log-schema-generator',
    context: {
      services: [
        { name: 'api-service', language: 'typescript', framework: 'express' }
      ],
      format: 'json',
      integration: 'elk',
      options: {
        includeCorrelationId: true,
        includePiiMasking: true
      }
    }
  }
}
```
