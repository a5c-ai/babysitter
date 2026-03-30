---
name: AST Manipulation
description: Expert skill for abstract syntax tree design, traversal, transformation, and manipulation patterns
category: Compiler Infrastructure
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# AST Manipulation Skill

## Overview

Expert skill for abstract syntax tree design, traversal, transformation, and manipulation patterns.

## Capabilities

- Design typed AST node hierarchies
- Implement visitor and transformer patterns
- Build AST rewriting systems
- Implement AST diffing and patching
- Generate AST pretty-printers and formatters
- Support AST serialization (JSON, binary)
- Implement pattern matching on AST structures
- Design span/location tracking systems

## Target Processes

- ast-design.js
- semantic-analysis.js
- ir-design.js
- code-generation-llvm.js
- lsp-server-implementation.js
- macro-system-implementation.js

## Dependencies

None (core skill)

## Usage Guidelines

1. **Node Design**: Design immutable AST nodes with clear ownership semantics
2. **Location Tracking**: Include source spans on all nodes from the beginning
3. **Visitor Pattern**: Implement visitor pattern for extensible traversal
4. **Transformation**: Use transformer pattern for AST-to-AST transformations
5. **Serialization**: Support both human-readable (JSON) and efficient (binary) serialization

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "nodeTypes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "fields": { "type": "array" },
          "parent": { "type": "string" }
        }
      }
    },
    "visitors": {
      "type": "array",
      "items": { "type": "string" }
    },
    "transformers": {
      "type": "array",
      "items": { "type": "string" }
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
