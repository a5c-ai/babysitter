---
name: FFI Design
description: Expert skill for designing and implementing foreign function interfaces to native code
category: Interoperability
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# FFI Design Skill

## Overview

Expert skill for designing and implementing foreign function interfaces to native code.

## Capabilities

- Design FFI declaration syntax
- Implement type marshaling between languages
- Handle C calling conventions (cdecl, stdcall, fastcall)
- Implement callback support (native calling managed)
- Handle string encoding conversions
- Implement struct layout matching (padding, alignment)
- Design memory ownership transfer rules
- Support dynamic library loading

## Target Processes

- ffi-implementation.js
- interpreter-implementation.js
- bytecode-vm-implementation.js
- code-generation-llvm.js

## Dependencies

- libffi
- Platform ABI documentation

## Usage Guidelines

1. **Safety**: Design safe wrappers around unsafe FFI calls
2. **Marshaling**: Document type marshaling rules explicitly
3. **Ownership**: Make memory ownership clear at FFI boundaries
4. **Callbacks**: Handle callback lifetimes carefully
5. **Strings**: Handle string encoding conversions correctly (UTF-8, UTF-16)

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "callingConventions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "marshalingRules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sourceType": { "type": "string" },
          "targetType": { "type": "string" }
        }
      }
    },
    "callbackSupport": { "type": "boolean" },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
