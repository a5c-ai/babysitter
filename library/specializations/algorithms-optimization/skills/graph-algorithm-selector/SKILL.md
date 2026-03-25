---
name: graph-algorithm-selector
description: Select optimal graph algorithm based on problem constraints
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Graph Algorithm Selector Skill

## Purpose

Select the optimal graph algorithm based on problem constraints, graph properties, and performance requirements.

## Capabilities

- Constraint analysis for algorithm selection
- Trade-off analysis (Dijkstra vs Bellman-Ford vs Floyd-Warshall)
- Special case detection (sparse vs dense, negative edges)
- Algorithm complexity mapping to constraints
- Suggest algorithm variants and optimizations

## Target Processes

- shortest-path-algorithms
- advanced-graph-algorithms
- graph-traversal
- graph-modeling

## Algorithm Selection Matrix

### Shortest Path
| Scenario | Algorithm | Complexity |
|----------|-----------|------------|
| Unweighted | BFS | O(V+E) |
| Non-negative weights | Dijkstra | O((V+E)log V) |
| Negative weights | Bellman-Ford | O(VE) |
| All pairs | Floyd-Warshall | O(V^3) |
| DAG | Topological + DP | O(V+E) |

### MST
| Scenario | Algorithm | Complexity |
|----------|-----------|------------|
| Sparse graph | Kruskal | O(E log E) |
| Dense graph | Prim | O(V^2) or O(E log V) |

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "problemType": {
      "type": "string",
      "enum": ["shortestPath", "mst", "connectivity", "flow", "matching", "traversal"]
    },
    "graphProperties": { "type": "object" },
    "constraints": {
      "type": "object",
      "properties": {
        "V": { "type": "integer" },
        "E": { "type": "integer" },
        "negativeWeights": { "type": "boolean" },
        "negativeCycles": { "type": "boolean" }
      }
    }
  },
  "required": ["problemType", "constraints"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "recommendedAlgorithm": { "type": "string" },
    "complexity": { "type": "string" },
    "alternatives": { "type": "array" },
    "reasoning": { "type": "string" }
  },
  "required": ["success", "recommendedAlgorithm"]
}
```
