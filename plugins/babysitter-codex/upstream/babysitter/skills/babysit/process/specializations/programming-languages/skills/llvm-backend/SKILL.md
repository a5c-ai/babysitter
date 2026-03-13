---
name: LLVM Backend
description: Expert skill for LLVM integration including IR generation, optimization passes, and native code emission
category: Code Generation
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# LLVM Backend Skill

## Overview

Expert skill for LLVM integration including IR generation, optimization passes, and native code emission.

## Capabilities

- Generate LLVM IR from high-level AST/IR
- Configure and run LLVM optimization passes
- Implement custom LLVM passes
- Handle LLVM type system mapping
- Generate debug information (DWARF)
- Configure target machine and code generation options
- Implement LLVM JIT (ORC, MCJIT) integration
- Handle cross-compilation target triples

## Target Processes

- code-generation-llvm.js
- jit-compiler-development.js
- debugger-adapter-development.js
- ir-design.js

## Dependencies

- LLVM C++ API
- llvm-sys bindings
- Inkwell (Rust LLVM bindings)

## Usage Guidelines

1. **Type Mapping**: Establish clear mapping between source types and LLVM types
2. **SSA Form**: Leverage LLVM's SSA form; generate clean IR and let LLVM optimize
3. **Debug Info**: Generate debug info from the start using DIBuilder
4. **Optimization Levels**: Test with -O0 first, then enable optimizations incrementally
5. **Target Configuration**: Abstract target-specific code behind target triple configuration

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "llvmVersion": { "type": "string" },
    "targetTriple": { "type": "string" },
    "optimizationLevel": {
      "type": "string",
      "enum": ["O0", "O1", "O2", "O3", "Os", "Oz"]
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
