---
name: micro-optimizer
description: Apply language-specific micro-optimizations
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Micro-Optimizer Skill

## Purpose

Apply language-specific micro-optimizations to squeeze maximum performance from competitive programming solutions.

## Capabilities

- C++ optimization tricks (fast I/O, pragma optimizations)
- Python optimization (PyPy hints, list comprehensions)
- Memory layout optimization
- Vectorization opportunities
- Compiler-specific optimizations

## Target Processes

- code-level-optimization
- io-optimization
- memory-optimization

## Optimization Catalog

### C++ Optimizations
- Fast I/O: `ios_base::sync_with_stdio(false)`
- Pragma optimizations: `#pragma GCC optimize`
- Inline expansion
- Loop unrolling
- Memory prefetching

### Python Optimizations
- Use PyPy when possible
- List comprehensions over loops
- Local variable caching
- `__slots__` for classes
- Avoiding global lookups

### General Optimizations
- Branch prediction hints
- Cache-friendly data layout
- Avoiding unnecessary copies
- Bit manipulation tricks

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "code": { "type": "string" },
    "language": {
      "type": "string",
      "enum": ["cpp", "python", "java"]
    },
    "optimizationLevel": {
      "type": "string",
      "enum": ["safe", "aggressive", "maximum"]
    },
    "preserveReadability": { "type": "boolean", "default": true }
  },
  "required": ["code", "language"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "optimizedCode": { "type": "string" },
    "appliedOptimizations": { "type": "array" },
    "expectedSpeedup": { "type": "string" },
    "warnings": { "type": "array" }
  },
  "required": ["success", "optimizedCode"]
}
```
