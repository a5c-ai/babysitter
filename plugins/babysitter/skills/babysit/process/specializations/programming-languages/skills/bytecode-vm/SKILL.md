---
name: Bytecode VM
description: Expert skill for bytecode virtual machine design including instruction set design, dispatch mechanisms, and stack/register architectures
category: Runtime
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Bytecode VM Skill

## Overview

Expert skill for bytecode virtual machine design including instruction set design, dispatch mechanisms, and stack/register architectures.

## Capabilities

- Design bytecode instruction sets
- Implement stack-based vs register-based VMs
- Implement efficient dispatch (switch, computed goto, threaded)
- Design compact bytecode encoding
- Implement bytecode verification
- Handle exception handling in bytecode
- Design inline caching for dynamic dispatch
- Implement bytecode serialization/deserialization

## Target Processes

- bytecode-vm-implementation.js
- interpreter-implementation.js
- jit-compiler-development.js
- repl-development.js

## Dependencies

VM implementation literature (Crafting Interpreters, Programming Language Pragmatics)

## Usage Guidelines

1. **Architecture Selection**: Choose stack-based for simplicity, register-based for performance
2. **Dispatch Mechanism**: Use computed goto/threaded dispatch for hot loops
3. **Encoding**: Design compact bytecode encoding to improve cache locality
4. **Verification**: Implement bytecode verification for security and debugging
5. **Inline Caching**: Add inline caching for polymorphic call sites

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "architecture": {
      "type": "string",
      "enum": ["stack-based", "register-based", "hybrid"]
    },
    "dispatch": {
      "type": "string",
      "enum": ["switch", "computed-goto", "direct-threaded", "indirect-threaded"]
    },
    "instructionCount": { "type": "integer" },
    "encoding": {
      "type": "string",
      "enum": ["fixed-width", "variable-length"]
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
