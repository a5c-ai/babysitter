---
name: Memory Allocator
description: Expert skill for custom memory allocator design optimized for language runtime needs
category: Memory Management
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Memory Allocator Skill

## Overview

Expert skill for custom memory allocator design optimized for language runtime needs.

## Capabilities

- Implement bump/arena allocators
- Implement free-list allocators with size classes
- Design slab allocators for fixed-size objects
- Implement thread-local allocation buffers (TLAB)
- Handle large object allocation strategies
- Implement memory pooling and recycling
- Design memory profiling and statistics
- Implement address space layout optimization

## Target Processes

- memory-allocator-design.js
- garbage-collector-implementation.js
- interpreter-implementation.js
- bytecode-vm-implementation.js

## Dependencies

jemalloc, tcmalloc references

## Usage Guidelines

1. **Size Classes**: Design size classes to minimize internal fragmentation
2. **Thread Safety**: Use thread-local allocation for hot paths
3. **Large Objects**: Handle large objects separately from small allocations
4. **Profiling**: Build allocation statistics from the start
5. **GC Integration**: Design allocator API with GC integration in mind

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "allocatorType": {
      "type": "string",
      "enum": ["bump", "free-list", "slab", "hybrid"]
    },
    "sizeClasses": {
      "type": "array",
      "items": { "type": "integer" }
    },
    "threadSafety": {
      "type": "string",
      "enum": ["single-threaded", "tlab", "lock-free"]
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
