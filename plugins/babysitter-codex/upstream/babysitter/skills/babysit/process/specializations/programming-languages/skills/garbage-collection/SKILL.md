---
name: Garbage Collection
description: Expert skill for garbage collector design and implementation including various collection algorithms
category: Memory Management
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Garbage Collection Skill

## Overview

Expert skill for garbage collector design and implementation including various collection algorithms.

## Capabilities

- Implement mark-sweep collection
- Implement copying/semi-space collectors
- Implement generational collection with write barriers
- Implement concurrent/incremental marking (tri-color)
- Design object header layouts and type info
- Implement precise vs conservative root scanning
- Design card table and remembered set implementations
- Implement finalizers and weak references

## Target Processes

- garbage-collector-implementation.js
- memory-allocator-design.js
- interpreter-implementation.js
- bytecode-vm-implementation.js

## Dependencies

GC Handbook literature (Jones, Hosking, Moss)

## Usage Guidelines

1. **Algorithm Selection**: Start with simple mark-sweep, evolve to generational as needed
2. **Write Barriers**: Design write barriers early if considering generational/concurrent GC
3. **Root Scanning**: Implement precise root scanning for safety
4. **Pause Times**: Measure pause times and optimize for application requirements
5. **Testing**: Build GC stress tests and allocation-heavy benchmarks

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "algorithm": {
      "type": "string",
      "enum": ["mark-sweep", "copying", "mark-compact", "generational", "concurrent"]
    },
    "writeBarrier": {
      "type": "string",
      "enum": ["none", "card-table", "remembered-set", "snapshot-at-beginning", "incremental-update"]
    },
    "rootScanning": {
      "type": "string",
      "enum": ["conservative", "precise"]
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
