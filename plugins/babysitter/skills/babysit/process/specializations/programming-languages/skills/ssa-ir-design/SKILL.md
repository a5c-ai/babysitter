---
name: SSA/IR Design
description: Expert skill for designing intermediate representations and implementing SSA construction
category: Compiler Middle-end
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# SSA/IR Design Skill

## Overview

Expert skill for designing intermediate representations and implementing SSA (Static Single Assignment) construction.

## Capabilities

- Design control flow graph (CFG) structures
- Implement dominance tree computation
- Implement SSA construction algorithms (Cytron et al.)
- Design phi function placement and pruning
- Implement SSA destruction for register allocation
- Design sea-of-nodes IR representations
- Implement basic block reordering
- Design IR verification passes

## Target Processes

- ir-design.js
- code-generation-llvm.js
- jit-compiler-development.js
- semantic-analysis.js

## Dependencies

Compiler optimization textbooks (Engineering a Compiler, Modern Compiler Implementation)

## Usage Guidelines

1. **CFG Design**: Start with a clear CFG representation with explicit entry/exit blocks
2. **Dominance**: Implement dominance computation before SSA construction
3. **Phi Placement**: Use dominance frontiers for minimal phi placement
4. **Verification**: Build IR verification passes to catch malformed IR early
5. **Debugging**: Include IR pretty-printing from the start for debugging

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "irStyle": {
      "type": "string",
      "enum": ["basic-blocks", "sea-of-nodes", "continuation-passing"]
    },
    "ssaConstruction": {
      "type": "string",
      "enum": ["cytron", "braun", "sreedhar"]
    },
    "passes": {
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
