---
name: flow-network-builder
description: Model optimization problems as network flow problems
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Flow Network Builder Skill

## Purpose

Model optimization problems as network flow problems, constructing appropriate flow networks and selecting optimal algorithms.

## Capabilities

- Identify max-flow/min-cut modeling opportunities
- Construct flow network from problem description
- Select optimal flow algorithm
- Handle min-cost flow variants
- Bipartite matching reduction
- Circulation problems

## Target Processes

- advanced-graph-algorithms
- graph-modeling
- optimization problems

## Flow Problem Types

1. **Maximum Flow**: Find max flow from source to sink
2. **Minimum Cut**: Partition minimizing cut capacity
3. **Bipartite Matching**: Maximum matching via flow
4. **Min-Cost Max-Flow**: Cheapest maximum flow
5. **Circulation**: Flow with lower bounds

## Reduction Patterns

- Assignment problems -> Bipartite matching
- Scheduling -> Flow with constraints
- Path cover -> Flow reduction
- Edge-disjoint paths -> Unit capacity flow

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "problemDescription": { "type": "string" },
    "problemType": {
      "type": "string",
      "enum": ["maxFlow", "minCut", "matching", "minCostFlow", "circulation"]
    },
    "constraints": { "type": "object" }
  },
  "required": ["problemDescription"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "networkDescription": { "type": "string" },
    "nodes": { "type": "array" },
    "edges": { "type": "array" },
    "source": { "type": "string" },
    "sink": { "type": "string" },
    "algorithm": { "type": "string" },
    "reduction": { "type": "string" }
  },
  "required": ["success"]
}
```
