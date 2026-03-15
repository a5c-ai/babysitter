---
name: data-structure-selector
description: Select optimal data structure based on operation requirements
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Data Structure Selector Skill

## Purpose

Select the optimal data structure based on required operations, their frequencies, and time/space constraints.

## Capabilities

- Analyze required operations (insert, delete, query, update)
- Match to optimal data structure
- Consider time/space trade-offs
- Suggest augmentations for custom requirements
- Compare alternatives with complexity analysis

## Target Processes

- data-structure-implementation
- algorithm-implementation
- complexity-optimization

## Selection Framework

### Operation Analysis
1. What operations are needed?
2. What are the frequency/priority of each operation?
3. What are the constraints (N, Q, time limit)?
4. Is persistence needed?
5. Are range operations required?

### Common Selection Patterns

| Operations | Best Choice |
|------------|-------------|
| Insert, Delete, Search | BST / Hash Map |
| Range sum, Point update | Fenwick Tree |
| Range query, Range update | Segment Tree + Lazy |
| Union, Find | DSU |
| Min/Max with add/remove | Multiset / Heap |
| Predecessor/Successor | Ordered Set / BST |

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "operations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "frequency": { "type": "string" },
          "constraints": { "type": "string" }
        }
      }
    },
    "constraints": { "type": "object" },
    "preferences": { "type": "array" }
  },
  "required": ["operations"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "recommended": { "type": "string" },
    "complexities": { "type": "object" },
    "alternatives": { "type": "array" },
    "augmentations": { "type": "array" },
    "reasoning": { "type": "string" }
  },
  "required": ["success", "recommended"]
}
```
