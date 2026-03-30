---
name: network-optimizer
description: Network optimization skill for transportation, assignment, and flow problems on graph structures.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: operations-research
  backlog-id: SK-IE-003
---

# network-optimizer

You are **network-optimizer** - a specialized skill for solving network optimization problems including shortest paths, minimum spanning trees, maximum flows, and assignment problems.

## Overview

This skill enables AI-powered network optimization including:
- Shortest path algorithm selection (Dijkstra, Bellman-Ford, Floyd-Warshall)
- Minimum spanning tree generation
- Maximum flow / minimum cut analysis
- Minimum cost network flow modeling
- Assignment problem solving (Hungarian algorithm)
- Network simplex implementation
- Multi-commodity flow modeling

## Prerequisites

- Python 3.8+ with NetworkX installed
- Google OR-Tools for advanced problems
- Understanding of graph theory

## Capabilities

### 1. Shortest Path Algorithms

```python
import networkx as nx

def shortest_path_analysis(G, source, target):
    """
    Select and apply appropriate shortest path algorithm
    """
    # Check for negative weights
    has_negative = any(d.get('weight', 1) < 0
                       for u, v, d in G.edges(data=True))

    if not has_negative:
        # Dijkstra for non-negative weights
        path = nx.dijkstra_path(G, source, target)
        length = nx.dijkstra_path_length(G, source, target)
    else:
        # Bellman-Ford for negative weights
        path = nx.bellman_ford_path(G, source, target)
        length = nx.bellman_ford_path_length(G, source, target)

    return {
        "path": path,
        "length": length,
        "algorithm": "dijkstra" if not has_negative else "bellman_ford"
    }

# All-pairs shortest paths
def all_pairs_shortest_paths(G):
    # Floyd-Warshall for dense graphs
    if G.number_of_edges() > G.number_of_nodes()**2 / 4:
        return dict(nx.floyd_warshall(G))
    else:
        # Johnson for sparse graphs
        return dict(nx.johnson(G))
```

### 2. Minimum Spanning Tree

```python
def minimum_spanning_tree(G, algorithm='kruskal'):
    """
    Generate minimum spanning tree
    """
    if algorithm == 'kruskal':
        mst = nx.minimum_spanning_tree(G, algorithm='kruskal')
    elif algorithm == 'prim':
        mst = nx.minimum_spanning_tree(G, algorithm='prim')

    total_weight = sum(d['weight'] for u, v, d in mst.edges(data=True))

    return {
        "tree": mst,
        "total_weight": total_weight,
        "edges": list(mst.edges(data=True))
    }
```

### 3. Maximum Flow / Minimum Cut

```python
def max_flow_min_cut(G, source, sink):
    """
    Compute maximum flow and minimum cut
    """
    # Maximum flow
    flow_value, flow_dict = nx.maximum_flow(G, source, sink)

    # Minimum cut
    cut_value, partition = nx.minimum_cut(G, source, sink)

    # Identify cut edges
    reachable, non_reachable = partition
    cut_edges = [(u, v) for u in reachable for v in G[u]
                 if v in non_reachable]

    return {
        "max_flow": flow_value,
        "flow_dict": flow_dict,
        "min_cut_value": cut_value,
        "cut_edges": cut_edges,
        "source_side": list(reachable),
        "sink_side": list(non_reachable)
    }
```

### 4. Minimum Cost Flow

```python
from ortools.graph.python import min_cost_flow

def min_cost_flow_problem(nodes, arcs):
    """
    Solve minimum cost network flow
    """
    smcf = min_cost_flow.SimpleMinCostFlow()

    # Add arcs: (start, end, capacity, unit_cost)
    for start, end, capacity, cost in arcs:
        smcf.add_arc_with_capacity_and_unit_cost(
            start, end, capacity, cost
        )

    # Set supplies/demands
    for node, supply in nodes.items():
        smcf.set_node_supply(node, supply)

    status = smcf.solve()

    if status == smcf.OPTIMAL:
        result = {
            "status": "optimal",
            "total_cost": smcf.optimal_cost(),
            "flows": []
        }
        for i in range(smcf.num_arcs()):
            if smcf.flow(i) > 0:
                result["flows"].append({
                    "from": smcf.tail(i),
                    "to": smcf.head(i),
                    "flow": smcf.flow(i),
                    "cost": smcf.flow(i) * smcf.unit_cost(i)
                })
        return result

    return {"status": "infeasible"}
```

### 5. Assignment Problem (Hungarian Algorithm)

```python
from scipy.optimize import linear_sum_assignment

def assignment_problem(cost_matrix):
    """
    Solve assignment problem using Hungarian algorithm
    """
    row_ind, col_ind = linear_sum_assignment(cost_matrix)

    total_cost = cost_matrix[row_ind, col_ind].sum()

    assignments = list(zip(row_ind.tolist(), col_ind.tolist()))

    return {
        "total_cost": total_cost,
        "assignments": assignments,
        "assignment_costs": cost_matrix[row_ind, col_ind].tolist()
    }
```

### 6. Multi-Commodity Flow

```python
def multi_commodity_flow(G, commodities):
    """
    Model multi-commodity flow problem
    commodities: list of (source, sink, demand)
    """
    from ortools.linear_solver import pywraplp

    solver = pywraplp.Solver.CreateSolver('GLOP')

    # Flow variables for each commodity on each edge
    flows = {}
    for k, (s, t, d) in enumerate(commodities):
        for u, v in G.edges():
            flows[k, u, v] = solver.NumVar(0, G[u][v]['capacity'],
                                           f'f_{k}_{u}_{v}')

    # Flow conservation
    for k, (s, t, d) in enumerate(commodities):
        for node in G.nodes():
            inflow = sum(flows[k, u, node] for u in G.predecessors(node))
            outflow = sum(flows[k, node, v] for v in G.successors(node))

            if node == s:
                solver.Add(outflow - inflow == d)
            elif node == t:
                solver.Add(inflow - outflow == d)
            else:
                solver.Add(inflow == outflow)

    # Capacity constraints (shared)
    for u, v in G.edges():
        solver.Add(sum(flows[k, u, v] for k in range(len(commodities)))
                  <= G[u][v]['capacity'])

    # Minimize total cost
    solver.Minimize(sum(
        flows[k, u, v] * G[u][v].get('cost', 1)
        for k in range(len(commodities))
        for u, v in G.edges()
    ))

    solver.Solve()
    return solver
```

## Process Integration

This skill integrates with the following processes:
- `transportation-route-optimization.js`
- `warehouse-layout-slotting-optimization.js`
- `capacity-planning-analysis.js`

## Output Format

```json
{
  "problem_type": "max_flow",
  "status": "optimal",
  "objective": 23.0,
  "solution": {
    "flow_paths": [
      {"path": ["s", "a", "b", "t"], "flow": 10},
      {"path": ["s", "c", "t"], "flow": 13}
    ]
  },
  "analysis": {
    "bottleneck_edges": [["a", "b"], ["c", "t"]],
    "recommendations": ["Increase capacity on edge (a,b)"]
  }
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| NetworkX | Graph analysis | General networks |
| OR-Tools | Min cost flow | Large-scale |
| igraph | Fast algorithms | Performance |
| SciPy | Assignment | Hungarian method |

## Best Practices

1. **Choose appropriate algorithm** - Match algorithm to problem structure
2. **Handle infeasibility** - Check for disconnected components
3. **Scale weights** - Avoid numerical issues
4. **Visualize networks** - Aid debugging and communication
5. **Test edge cases** - Empty graphs, single nodes

## Constraints

- Verify network connectivity before solving
- Document all edge weights and capacities
- Handle negative cycles appropriately
- Report infeasibility clearly
