---
name: Error Messages
description: Expert skill for designing and implementing high-quality compiler error messages
category: User Experience
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Error Messages Skill

## Overview

Expert skill for designing and implementing high-quality compiler error messages.

## Capabilities

- Design clear, actionable error message templates
- Implement source context display with underlines
- Generate fix suggestions and quick fixes
- Handle error cascades and suppression
- Implement multi-span error annotations
- Support machine-readable error output (JSON)
- Implement color/styled terminal output
- Design error recovery strategies for better diagnostics

## Target Processes

- error-message-enhancement.js
- parser-development.js
- type-system-implementation.js
- semantic-analysis.js
- lsp-server-implementation.js

## Dependencies

Elm/Rust error message guidelines

## Usage Guidelines

1. **Clarity**: Make error messages clear and actionable
2. **Context**: Show relevant source code context with precise location
3. **Suggestions**: Provide fix suggestions when possible
4. **Cascades**: Suppress cascading errors to avoid overwhelming users
5. **Machine-Readable**: Support JSON output for tooling integration

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "errorFormat": {
      "type": "string",
      "enum": ["human", "json", "sarif"]
    },
    "features": {
      "type": "array",
      "items": { "type": "string" }
    },
    "colorSupport": { "type": "boolean" },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
