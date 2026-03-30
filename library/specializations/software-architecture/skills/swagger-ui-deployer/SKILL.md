---
name: swagger-ui-deployer
description: Deploy interactive API documentation using Swagger UI with custom branding
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Swagger UI Deployer Skill

## Overview

Deploys interactive API documentation using Swagger UI with configuration options, custom branding, and static HTML generation.

## Capabilities

- Deploy interactive API documentation
- Configure Swagger UI options
- Generate static HTML documentation
- Custom branding and theming support
- Multiple spec file support
- Authentication configuration
- Deep linking support

## Target Processes

- api-design-specification

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
    "outputDir": {
      "type": "string",
      "description": "Output directory for static files"
    },
    "config": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Documentation title"
        },
        "deepLinking": {
          "type": "boolean",
          "default": true
        },
        "displayOperationId": {
          "type": "boolean",
          "default": false
        },
        "defaultModelsExpandDepth": {
          "type": "number",
          "default": 1
        }
      }
    },
    "branding": {
      "type": "object",
      "properties": {
        "logo": { "type": "string" },
        "primaryColor": { "type": "string" },
        "favicon": { "type": "string" }
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
    "outputDir": {
      "type": "string"
    },
    "indexPath": {
      "type": "string"
    },
    "files": {
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
    name: 'swagger-ui-deployer',
    context: {
      specPath: 'api/openapi.yaml',
      outputDir: 'docs/api',
      config: {
        title: 'My API Documentation',
        deepLinking: true
      },
      branding: {
        primaryColor: '#3b82f6'
      }
    }
  }
}
```
