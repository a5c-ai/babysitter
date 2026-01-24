---
name: Source Maps
description: Expert skill for generating and consuming source maps for debugging compiled code
category: Tooling
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Source Maps Skill

## Overview

Expert skill for generating and consuming source maps for debugging compiled code.

## Capabilities

- Generate source maps in various formats (V3 JSON, DWARF)
- Map generated positions to original source
- Handle inlined functions in source maps
- Implement source map composition/chaining
- Generate VLQ-encoded mappings
- Support names array for identifiers
- Handle multi-file source map indices
- Integrate with debuggers and stack traces

## Target Processes

- source-map-generation.js
- code-generation-llvm.js
- debugger-adapter-development.js
- jit-compiler-development.js

## Dependencies

Source map V3 specification

## Usage Guidelines

1. **Accuracy**: Ensure precise mapping between generated and original positions
2. **Inlining**: Handle inlined code with multiple source locations
3. **Composition**: Support chaining for multi-stage compilation
4. **Efficiency**: Use VLQ encoding for compact representations
5. **Integration**: Test with actual debuggers to verify correctness

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "format": {
      "type": "string",
      "enum": ["v3-json", "dwarf", "pdb"]
    },
    "features": {
      "type": "array",
      "items": { "type": "string" }
    },
    "inlineSupport": { "type": "boolean" },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
