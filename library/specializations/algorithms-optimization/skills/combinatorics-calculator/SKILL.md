---
name: combinatorics-calculator
description: Calculate combinatorial values with modular arithmetic
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Combinatorics Calculator Skill

## Purpose

Calculate combinatorial values with modular arithmetic support for competitive programming applications.

## Capabilities

- Factorial and inverse factorial precomputation
- nCr, nPr with modular arithmetic
- Catalan, Stirling, Bell numbers
- Lucas theorem implementation
- Inclusion-exclusion principle application
- Generating functions

## Target Processes

- combinatorics-counting
- number-theory-algorithms
- dp-pattern-matching

## Combinatorial Functions

### Basic Counting
- Factorial: n!
- Permutations: P(n,r) = n!/(n-r)!
- Combinations: C(n,r) = n!/(r!(n-r)!)

### Special Numbers
- Catalan numbers
- Stirling numbers (first and second kind)
- Bell numbers
- Derangements

### Advanced Techniques
- Lucas theorem (for large n, small p)
- Inclusion-exclusion
- Burnside's lemma
- Generating functions

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["nCr", "nPr", "factorial", "catalan", "stirling", "lucas", "precompute"]
    },
    "n": { "type": "integer" },
    "r": { "type": "integer" },
    "mod": { "type": "integer" },
    "precomputeLimit": { "type": "integer" }
  },
  "required": ["operation"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "result": { "type": "integer" },
    "code": { "type": "string" },
    "formula": { "type": "string" }
  },
  "required": ["success"]
}
```
