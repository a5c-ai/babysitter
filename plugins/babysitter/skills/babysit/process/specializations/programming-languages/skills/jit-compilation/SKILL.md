---
name: JIT Compilation
description: Expert skill for just-in-time compilation including profiling, tiered compilation, and deoptimization
category: Runtime Optimization
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# JIT Compilation Skill

## Overview

Expert skill for just-in-time compilation including profiling, tiered compilation, and deoptimization.

## Capabilities

- Implement execution profiling and hot path detection
- Design tiered compilation strategies (baseline + optimizing)
- Implement on-stack replacement (OSR)
- Implement speculative optimizations with guards
- Design deoptimization frame reconstruction
- Implement inline caching and type feedback
- Design code cache management and eviction
- Implement method inlining heuristics

## Target Processes

- jit-compiler-development.js
- bytecode-vm-implementation.js
- interpreter-implementation.js

## Dependencies

V8/HotSpot architecture references

## Usage Guidelines

1. **Tiered Approach**: Start with a baseline tier, add optimizing tier when profiling data is available
2. **Profile-Guided**: Use profiling data to guide optimization decisions
3. **Speculation**: Implement guards for speculative optimizations with clean deoptimization
4. **OSR**: Implement OSR for long-running loops to benefit from optimization mid-execution
5. **Code Cache**: Implement code cache management to handle memory pressure

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "tiers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "trigger": { "type": "string" }
        }
      }
    },
    "profilingMethod": {
      "type": "string",
      "enum": ["counters", "sampling", "tracing"]
    },
    "osrSupport": { "type": "boolean" },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
