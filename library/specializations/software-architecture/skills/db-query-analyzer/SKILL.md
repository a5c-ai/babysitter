---
name: db-query-analyzer
description: Analyze database query performance with execution plans and index recommendations
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Database Query Analyzer Skill

## Overview

Analyzes database query performance including execution plan analysis, index recommendations, slow query identification, and optimization suggestions.

## Capabilities

- Query execution plan analysis
- Index recommendation
- Slow query identification
- Query optimization suggestions
- Table scan detection
- Join optimization analysis
- Support for PostgreSQL, MySQL, SQL Server

## Target Processes

- performance-optimization
- data-architecture-design

## Input Schema

```json
{
  "type": "object",
  "required": ["queries"],
  "properties": {
    "queries": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sql": { "type": "string" },
          "name": { "type": "string" }
        }
      }
    },
    "database": {
      "type": "string",
      "enum": ["postgresql", "mysql", "sqlserver", "oracle"],
      "default": "postgresql"
    },
    "connectionString": {
      "type": "string",
      "description": "Database connection string (optional, for live analysis)"
    },
    "options": {
      "type": "object",
      "properties": {
        "analyzeExplain": {
          "type": "boolean",
          "default": true
        },
        "suggestIndexes": {
          "type": "boolean",
          "default": true
        },
        "slowQueryThreshold": {
          "type": "number",
          "default": 1000,
          "description": "Slow query threshold in milliseconds"
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
    "analyses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "executionPlan": { "type": "object" },
          "estimatedCost": { "type": "number" },
          "issues": { "type": "array" },
          "suggestions": { "type": "array" }
        }
      }
    },
    "indexRecommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "table": { "type": "string" },
          "columns": { "type": "array" },
          "type": { "type": "string" },
          "reason": { "type": "string" }
        }
      }
    },
    "slowQueries": {
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
    name: 'db-query-analyzer',
    context: {
      queries: [
        { sql: 'SELECT * FROM users WHERE email = ?', name: 'get-user-by-email' }
      ],
      database: 'postgresql',
      options: {
        analyzeExplain: true,
        suggestIndexes: true
      }
    }
  }
}
```
