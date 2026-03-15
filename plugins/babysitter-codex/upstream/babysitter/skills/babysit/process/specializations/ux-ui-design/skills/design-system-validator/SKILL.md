---
name: design-system-validator
description: Validate design system compliance in code and detect token usage violations
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Design System Validator Skill

## Purpose

Validate that code adheres to design system specifications, checking token usage, component props, and style consistency.

## Capabilities

- Check design token usage in CSS/SCSS
- Validate component prop usage
- Detect hard-coded values that should use tokens
- Ensure naming convention compliance
- Generate compliance reports
- Integrate with linting tools

## Target Processes

- design-system.js
- component-library.js

## Integration Points

- ESLint plugins for design systems
- Stylelint for CSS validation
- Custom AST analyzers
- Token documentation

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "scanPath": {
      "type": "string",
      "description": "Path to code to validate"
    },
    "tokenDefinitions": {
      "type": "string",
      "description": "Path to design token definitions"
    },
    "rules": {
      "type": "object",
      "properties": {
        "enforceTokenColors": { "type": "boolean", "default": true },
        "enforceTokenSpacing": { "type": "boolean", "default": true },
        "enforceTokenTypography": { "type": "boolean", "default": true },
        "allowHardcodedValues": { "type": "array", "items": { "type": "string" } }
      }
    },
    "fileTypes": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["css", "scss", "tsx", "jsx"]
    },
    "severity": {
      "type": "string",
      "enum": ["error", "warning", "info"],
      "default": "warning"
    }
  },
  "required": ["scanPath", "tokenDefinitions"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "violations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": { "type": "string" },
          "line": { "type": "number" },
          "rule": { "type": "string" },
          "message": { "type": "string" },
          "suggestion": { "type": "string" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "filesScanned": { "type": "number" },
        "totalViolations": { "type": "number" },
        "byRule": { "type": "object" },
        "complianceScore": { "type": "number" }
      }
    },
    "tokenCoverage": {
      "type": "object",
      "description": "Token usage statistics"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  scanPath: './src/components',
  tokenDefinitions: './tokens/design-tokens.json',
  rules: {
    enforceTokenColors: true,
    enforceTokenSpacing: true,
    enforceTokenTypography: true
  },
  severity: 'warning'
});
```
