---
name: graph-algorithm-library
description: Graph algorithms for discrete mathematics
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: discrete-mathematics
  domain: mathematics
  backlog-id: SK-MATH-027
  tools:
    - NetworkX
    - igraph
    - graph-tool
  processes:
    - network-analysis
    - algorithm-design
---

# Graph Algorithm Library Skill

## Purpose

Provides comprehensive graph algorithms for discrete mathematics, network analysis, and combinatorial optimization.

## Capabilities

- **Traversal**: BFS, DFS, topological sort
- **Shortest Paths**: Dijkstra, Bellman-Ford, Floyd-Warshall
- **Connectivity**: Components, bridges, articulation points
- **Flow Algorithms**: Max flow, min cut, matching
- **Spectral Methods**: Graph Laplacian, spectral clustering
- **Centrality**: Betweenness, closeness, PageRank

## Usage Guidelines

1. **Algorithm Selection**
   - Analyze graph properties
   - Consider time/space complexity
   - Choose appropriate data structures

2. **Implementation**
   - Validate graph input
   - Handle edge cases
   - Optimize for specific graph types

3. **Analysis**
   - Verify algorithm correctness
   - Benchmark performance
   - Visualize results

4. **Best Practices**
   - Document graph assumptions
   - Test on edge cases
   - Consider parallel algorithms for large graphs
