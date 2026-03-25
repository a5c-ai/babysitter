---
name: BI Semantic Layer Generator
description: Generates semantic layer definitions for BI tools from dimensional models
version: 1.0.0
category: BI Tools
skillId: SK-DEA-009
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# BI Semantic Layer Generator

## Overview

Generates semantic layer definitions for BI tools from dimensional models. This skill automates the translation of dimensional models into platform-specific semantic definitions.

## Capabilities

- LookML generation (Looker)
- Tableau data model generation
- Power BI semantic model creation
- Cube.js schema generation
- dbt metrics layer integration
- Calculation and measure definitions
- Hierarchy generation
- Security filter generation
- Join path optimization

## Input Schema

```json
{
  "dimensionalModel": "object",
  "targetPlatform": "looker|tableau|powerbi|cubejs|dbt",
  "businessGlossary": "object",
  "securityRules": ["object"]
}
```

## Output Schema

```json
{
  "semanticModel": "object",
  "calculations": ["object"],
  "hierarchies": ["object"],
  "securityFilters": ["object"],
  "documentation": "string"
}
```

## Target Processes

- Metrics Layer
- BI Dashboard Development
- Data Warehouse Setup

## Usage Guidelines

1. Provide complete dimensional model definition
2. Specify target BI platform
3. Include business glossary for consistent naming
4. Define security rules for row-level filtering

## Best Practices

- Maintain consistency between semantic layer and source models
- Use business glossary terms for user-facing labels
- Implement hierarchies for drill-down analysis
- Configure appropriate caching strategies
- Document calculation logic for maintainability
