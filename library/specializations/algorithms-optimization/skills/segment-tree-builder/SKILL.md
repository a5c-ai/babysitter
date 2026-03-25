---
name: segment-tree-builder
description: Generate customized segment tree implementations
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Segment Tree Builder Skill

## Purpose

Generate customized segment tree implementations for various merge functions, with support for lazy propagation and advanced variants.

## Capabilities

- Generate segment tree for custom merge functions
- Lazy propagation template generation
- Persistent segment tree variants
- 2D segment tree generation
- Segment tree beats for complex updates
- Iterative vs recursive implementations

## Target Processes

- segment-tree-implementation
- range-query-optimization
- data-structure-implementation

## Segment Tree Variants

1. **Basic**: Point update, range query
2. **Lazy Propagation**: Range update, range query
3. **Persistent**: Version history preservation
4. **2D Segment Tree**: 2D range queries
5. **Segment Tree Beats**: Complex range updates (chmin, chmax)
6. **Merge Sort Tree**: Range order statistics

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "mergeFunction": { "type": "string" },
    "identity": { "type": "string" },
    "updateType": {
      "type": "string",
      "enum": ["point", "range", "both"]
    },
    "lazyPropagation": { "type": "boolean" },
    "variant": {
      "type": "string",
      "enum": ["basic", "lazy", "persistent", "2d", "beats"]
    },
    "language": {
      "type": "string",
      "enum": ["cpp", "python", "java"]
    },
    "style": {
      "type": "string",
      "enum": ["recursive", "iterative"]
    }
  },
  "required": ["mergeFunction", "identity"]
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
    "usage": { "type": "string" }
  },
  "required": ["success", "code"]
}
```
