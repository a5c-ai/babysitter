---
name: code-template-manager
description: Manage and generate competitive programming templates
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Code Template Manager Skill

## Purpose

Manage and generate competitive programming code templates for various algorithms, data structures, and common patterns across multiple languages.

## Capabilities

- Store and retrieve algorithm templates (C++, Python, Java)
- Fast I/O templates for different languages
- Data structure templates (segment tree, DSU, etc.)
- Template customization and versioning
- Generate problem-specific boilerplate
- Maintain personal template library

## Target Processes

- cp-library-creation
- codeforces-contest
- algorithm-implementation
- atcoder-contest

## Template Categories

1. **I/O Templates**: Fast input/output for each language
2. **Data Structures**: Segment tree, Fenwick tree, DSU, Treap, etc.
3. **Graph Algorithms**: DFS, BFS, Dijkstra, Bellman-Ford, etc.
4. **Number Theory**: Modular arithmetic, prime sieve, FFT/NTT
5. **String Algorithms**: KMP, Z-function, Suffix array, Hashing
6. **Geometry**: Point, Line, Polygon primitives

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["get", "list", "create", "update", "generateBoilerplate"]
    },
    "templateName": { "type": "string" },
    "language": { "type": "string", "enum": ["cpp", "python", "java"] },
    "category": { "type": "string" },
    "code": { "type": "string" }
  },
  "required": ["action"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "template": { "type": "string" },
    "templates": { "type": "array" },
    "error": { "type": "string" }
  },
  "required": ["success"]
}
```
