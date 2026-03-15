---
name: tech-writing-linter
description: Lint technical documentation for style, consistency, and readability
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Technical Writing Style Checker Skill

## Overview

Lints technical documentation for style, consistency, terminology, and readability using Vale, write-good, and custom style guides.

## Capabilities

- Vale and write-good integration
- Technical writing rules enforcement
- Terminology consistency checking
- Readability scoring (Flesch-Kincaid, etc.)
- Custom style guide enforcement
- Jargon and passive voice detection
- Inclusive language checking

## Target Processes

- All documentation processes

## Input Schema

```json
{
  "type": "object",
  "required": ["paths"],
  "properties": {
    "paths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Paths to documentation files"
    },
    "engine": {
      "type": "string",
      "enum": ["vale", "write-good", "both"],
      "default": "vale"
    },
    "styleGuide": {
      "type": "string",
      "enum": ["google", "microsoft", "redhat", "custom"],
      "default": "google"
    },
    "options": {
      "type": "object",
      "properties": {
        "minReadability": {
          "type": "number",
          "default": 60,
          "description": "Minimum Flesch reading ease score"
        },
        "checkTerminology": {
          "type": "boolean",
          "default": true
        },
        "customTerms": {
          "type": "object",
          "description": "Custom terminology mappings"
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
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "issues": { "type": "array" },
          "readabilityScore": { "type": "number" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalIssues": { "type": "number" },
        "byCategory": { "type": "object" },
        "averageReadability": { "type": "number" }
      }
    }
  }
}
```

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'tech-writing-linter',
    context: {
      paths: ['docs/**/*.md'],
      engine: 'vale',
      styleGuide: 'google',
      options: {
        minReadability: 60,
        checkTerminology: true
      }
    }
  }
}
```
