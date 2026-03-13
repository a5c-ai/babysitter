---
name: REPL Development
description: Expert skill for building interactive REPLs with rich editing and evaluation features
category: Tooling
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# REPL Development Skill

## Overview

Expert skill for building interactive REPLs with rich editing and evaluation features.

## Capabilities

- Implement readline integration with history
- Handle multi-line input detection
- Implement tab completion for identifiers
- Design incremental compilation for REPL
- Handle top-level expression evaluation
- Implement persistent REPL state
- Design pretty-printing for values
- Support special REPL commands (:help, :type, etc.)

## Target Processes

- repl-development.js
- interpreter-implementation.js
- lsp-server-implementation.js

## Dependencies

- rustyline
- readline libraries
- linenoise

## Usage Guidelines

1. **Line Editing**: Use established readline libraries for robust line editing
2. **Multi-line**: Detect incomplete expressions for multi-line input
3. **Completion**: Implement context-aware tab completion
4. **History**: Persist history across sessions
5. **Commands**: Provide useful meta-commands (:help, :type, :quit, etc.)

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "lineLibrary": {
      "type": "string",
      "enum": ["readline", "rustyline", "linenoise", "custom"]
    },
    "features": {
      "type": "array",
      "items": { "type": "string" }
    },
    "commands": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
