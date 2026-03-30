---
name: code-profiler
description: Profile code performance and identify bottlenecks
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Glob
---

# Code Profiler Skill

## Purpose

Profile algorithm implementations to identify performance bottlenecks and optimization opportunities.

## Capabilities

- Runtime profiling
- Memory profiling
- Cache miss analysis
- Hot spot identification
- Optimization suggestions
- Comparative benchmarking

## Target Processes

- code-level-optimization
- complexity-optimization
- memory-optimization

## Profiling Dimensions

### Time Profiling
- Function-level timing
- Line-by-line profiling
- Call graph analysis
- Hot spot detection

### Memory Profiling
- Heap allocation tracking
- Memory leak detection
- Peak memory usage
- Allocation patterns

### Cache Analysis
- Cache miss rates
- Memory access patterns
- Data locality issues

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "code": { "type": "string" },
    "language": { "type": "string" },
    "profileType": {
      "type": "string",
      "enum": ["time", "memory", "cache", "all"]
    },
    "testInput": { "type": "string" },
    "iterations": { "type": "integer", "default": 1 }
  },
  "required": ["code", "profileType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "timing": { "type": "object" },
    "memory": { "type": "object" },
    "hotSpots": { "type": "array" },
    "recommendations": { "type": "array" }
  },
  "required": ["success"]
}
```

## Integration

Can integrate with profiling tools like gprof, perf, Valgrind, cProfile, and language-specific profilers.
