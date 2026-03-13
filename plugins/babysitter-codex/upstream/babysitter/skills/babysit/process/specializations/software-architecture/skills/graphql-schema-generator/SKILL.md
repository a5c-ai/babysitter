---
name: graphql-schema-generator
description: Generate GraphQL schemas from data models with resolver stubs and federation support
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# GraphQL Schema Generator Skill

## Overview

Generates GraphQL SDL schemas from data models with type inference, resolver stub generation, schema validation, and Apollo Federation support.

## Capabilities

- Generate GraphQL SDL from data models
- Type inference from existing data structures
- Resolver stub generation
- Schema validation and linting
- Apollo Federation support
- Subscription type generation
- Input type and mutation generation

## Target Processes

- api-design-specification

## Input Schema

```json
{
  "type": "object",
  "required": ["dataModels"],
  "properties": {
    "dataModels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "fields": { "type": "array" },
          "relationships": { "type": "array" }
        }
      }
    },
    "outputPath": {
      "type": "string",
      "description": "Output schema file path"
    },
    "options": {
      "type": "object",
      "properties": {
        "generateResolvers": {
          "type": "boolean",
          "default": true
        },
        "federation": {
          "type": "boolean",
          "default": false
        },
        "generateSubscriptions": {
          "type": "boolean",
          "default": false
        },
        "generateInputTypes": {
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
    "schemaPath": {
      "type": "string"
    },
    "resolversPath": {
      "type": "string"
    },
    "types": {
      "type": "array",
      "items": { "type": "string" }
    },
    "queries": {
      "type": "array"
    },
    "mutations": {
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
    name: 'graphql-schema-generator',
    context: {
      dataModels: [
        { name: 'User', fields: ['id', 'name', 'email'] },
        { name: 'Post', fields: ['id', 'title', 'authorId'] }
      ],
      outputPath: 'graphql/schema.graphql',
      options: {
        generateResolvers: true,
        federation: false
      }
    }
  }
}
```
