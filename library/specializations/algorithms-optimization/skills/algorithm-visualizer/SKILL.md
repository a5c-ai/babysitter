---
name: algorithm-visualizer
description: Generate visual representations of algorithm execution
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Glob
---

# Algorithm Visualizer Skill

## Purpose

Generate visual representations of algorithm execution to aid understanding, debugging, and explanation of algorithmic concepts.

## Capabilities

- Step-by-step execution visualization
- Data structure state visualization
- Graph algorithm animation
- DP table visualization
- Generate animated GIFs/videos
- Interactive visualization generation
- Tree and array state rendering

## Target Processes

- algorithm-implementation
- dp-pattern-matching
- graph-traversal
- interview-problem-explanation

## Visualization Types

1. **Array Operations**: Sorting, searching, two-pointer techniques
2. **Tree Structures**: Binary trees, BST operations, tree traversals
3. **Graph Algorithms**: BFS, DFS, shortest paths, MST
4. **DP Tables**: State transitions, optimal substructure
5. **Data Structures**: Stack, queue, heap operations

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "algorithm": { "type": "string" },
    "input": { "type": "object" },
    "format": {
      "type": "string",
      "enum": ["ascii", "svg", "gif", "html"]
    },
    "steps": { "type": "boolean", "default": true }
  },
  "required": ["algorithm", "input"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "visualization": { "type": "string" },
    "steps": { "type": "array" },
    "format": { "type": "string" }
  },
  "required": ["success"]
}
```

## Integration

Can integrate with visualization libraries like Manim, D3.js, or generate ASCII art for terminal-based visualization.
