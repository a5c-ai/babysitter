---
name: suffix-structure-builder
description: Build and query suffix arrays and related structures
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Suffix Structure Builder Skill

## Purpose

Build suffix arrays, suffix trees, and related structures with efficient construction algorithms and common query implementations.

## Capabilities

- Suffix array construction (SA-IS, DC3)
- LCP array construction
- Suffix tree construction
- Suffix automaton construction
- Query implementations for each structure
- Sparse table for LCP queries

## Target Processes

- trie-suffix-structures
- pattern-matching-algorithms
- string-processing

## Suffix Structures

### Suffix Array
- O(n log n) or O(n) construction
- Combined with LCP for powerful queries
- Pattern matching in O(m log n)

### LCP Array
- Kasai's algorithm O(n)
- Range minimum queries for LCA
- Distinct substring counting

### Suffix Tree
- Ukkonen's algorithm O(n)
- More complex but powerful
- Direct pattern matching O(m)

### Suffix Automaton
- O(n) construction
- Smallest automaton for all substrings
- Powerful for counting problems

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "structure": {
      "type": "string",
      "enum": ["suffixArray", "lcpArray", "suffixTree", "suffixAutomaton"]
    },
    "algorithm": { "type": "string" },
    "queries": { "type": "array" },
    "language": {
      "type": "string",
      "enum": ["cpp", "python", "java"]
    }
  },
  "required": ["structure"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "code": { "type": "string" },
    "complexity": { "type": "object" },
    "queryImplementations": { "type": "array" }
  },
  "required": ["success", "code"]
}
```
