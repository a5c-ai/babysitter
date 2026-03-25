---
name: invariant-analyzer
description: Identify and verify loop invariants for correctness proofs
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Invariant Analyzer Skill

## Purpose

Identify and verify loop invariants to help construct correctness proofs for algorithms.

## Capabilities

- Automatic loop invariant inference
- Invariant verification against code
- Precondition/postcondition extraction
- Generate formal proof structure
- Identify missing invariants

## Target Processes

- correctness-proof-testing
- algorithm-implementation

## Invariant Analysis Framework

### Loop Invariant Properties
1. **Initialization**: True before first iteration
2. **Maintenance**: If true before iteration, true after
3. **Termination**: Provides useful property at end

### Common Invariant Patterns
- Range invariants: "for all i in [0, k), property P(i) holds"
- Accumulator invariants: "sum equals sum of a[0..k-1]"
- Pointer invariants: "left < right and all elements < left are processed"
- State invariants: "data structure maintains property X"

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "code": { "type": "string" },
    "language": { "type": "string" },
    "loopIndex": { "type": "integer" },
    "expectedInvariant": { "type": "string" }
  },
  "required": ["code"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "invariants": { "type": "array" },
    "preconditions": { "type": "array" },
    "postconditions": { "type": "array" },
    "proofOutline": { "type": "string" }
  },
  "required": ["success"]
}
```
