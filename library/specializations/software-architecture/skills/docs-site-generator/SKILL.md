---
name: docs-site-generator
description: Generate documentation sites using Docusaurus, MkDocs, or VuePress
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Documentation Site Generator Skill

## Overview

Generates documentation sites using popular frameworks (Docusaurus, MkDocs, VuePress) with custom theme configuration and search integration.

## Capabilities

- Generate Docusaurus documentation sites
- Generate MkDocs documentation sites
- VuePress support
- Custom theme configuration
- Search integration (Algolia, local)
- Versioning support
- Multi-language support
- Sidebar auto-generation

## Target Processes

- c4-model-documentation
- api-design-specification
- observability-implementation

## Input Schema

```json
{
  "type": "object",
  "required": ["framework", "docsPath"],
  "properties": {
    "framework": {
      "type": "string",
      "enum": ["docusaurus", "mkdocs", "vuepress"],
      "default": "docusaurus"
    },
    "docsPath": {
      "type": "string",
      "description": "Path to documentation source files"
    },
    "outputDir": {
      "type": "string",
      "description": "Output directory for generated site"
    },
    "config": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "baseUrl": { "type": "string" },
        "theme": { "type": "string" },
        "search": {
          "type": "object",
          "properties": {
            "provider": {
              "type": "string",
              "enum": ["algolia", "local"]
            }
          }
        },
        "versioning": {
          "type": "boolean",
          "default": false
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
    "outputDir": {
      "type": "string"
    },
    "configPath": {
      "type": "string"
    },
    "pages": {
      "type": "array",
      "items": { "type": "string" }
    },
    "buildCommand": {
      "type": "string"
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'docs-site-generator',
    context: {
      framework: 'docusaurus',
      docsPath: 'docs',
      outputDir: 'website',
      config: {
        title: 'Project Documentation',
        baseUrl: '/docs/',
        theme: '@docusaurus/theme-classic'
      }
    }
  }
}
```
