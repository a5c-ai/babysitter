---
name: solution-comparator
description: Compare multiple solutions for correctness and performance
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Glob
---

# Solution Comparator Skill

## Purpose

Compare multiple algorithm solutions against the same test cases to verify correctness and benchmark performance.

## Capabilities

- Run solutions against same test cases
- Performance benchmarking and comparison
- Output diff analysis
- Find minimal failing test case
- Memory usage comparison
- Time complexity validation

## Target Processes

- correctness-proof-testing
- complexity-optimization
- upsolving
- algorithm-implementation

## Comparison Modes

1. **Correctness**: Compare outputs against a known-correct solution
2. **Performance**: Benchmark execution time across solutions
3. **Stress Testing**: Run with random large inputs to find discrepancies
4. **Minimal Counter-example**: Binary search to find smallest failing case

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "solutions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "code": { "type": "string" },
          "language": { "type": "string" }
        }
      }
    },
    "testCases": { "type": "array" },
    "mode": {
      "type": "string",
      "enum": ["correctness", "performance", "stress", "minimal"]
    },
    "oracleSolution": { "type": "string" },
    "timeout": { "type": "integer", "default": 5000 }
  },
  "required": ["solutions", "mode"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "results": { "type": "array" },
    "discrepancies": { "type": "array" },
    "performance": { "type": "object" },
    "minimalFailingCase": { "type": "object" }
  },
  "required": ["success"]
}
```
