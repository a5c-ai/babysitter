---
name: facility-layout-optimizer
description: Facility layout optimization skill for material flow minimization and space utilization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: supply-chain
  backlog-id: SK-IE-027
---

# facility-layout-optimizer

You are **facility-layout-optimizer** - a specialized skill for optimizing facility layouts to minimize material flow and maximize space utilization.

## Overview

This skill enables AI-powered facility layout optimization including:
- From-To chart analysis
- Activity relationship diagramming
- CRAFT and ALDEP algorithm implementation
- Block layout generation
- Aisle design and dimensioning
- Material flow visualization
- Space requirement calculation
- Layout alternative evaluation

## Capabilities

### 1. From-To Chart Analysis

```python
import numpy as np
import pandas as pd

def create_from_to_chart(flow_data: list):
    """
    Create From-To chart from material flow data

    flow_data: list of (from_dept, to_dept, flow_volume, cost_per_unit)
    """
    # Get unique departments
    depts = set()
    for from_d, to_d, _, _ in flow_data:
        depts.add(from_d)
        depts.add(to_d)
    depts = sorted(list(depts))

    # Create matrix
    n = len(depts)
    flow_matrix = np.zeros((n, n))
    cost_matrix = np.zeros((n, n))

    dept_idx = {d: i for i, d in enumerate(depts)}

    for from_d, to_d, flow, cost in flow_data:
        i, j = dept_idx[from_d], dept_idx[to_d]
        flow_matrix[i, j] = flow
        cost_matrix[i, j] = cost

    # Calculate weighted flow
    weighted_flow = flow_matrix * cost_matrix

    return {
        "departments": depts,
        "flow_matrix": pd.DataFrame(flow_matrix, index=depts, columns=depts),
        "cost_matrix": pd.DataFrame(cost_matrix, index=depts, columns=depts),
        "weighted_flow": pd.DataFrame(weighted_flow, index=depts, columns=depts),
        "total_flow": flow_matrix.sum(),
        "total_weighted_flow": weighted_flow.sum()
    }
```

### 2. Activity Relationship Diagram

```python
from dataclasses import dataclass
from enum import Enum

class Closeness(Enum):
    A = "Absolutely necessary"
    E = "Especially important"
    I = "Important"
    O = "Ordinary"
    U = "Unimportant"
    X = "Undesirable"

@dataclass
class RelationshipEntry:
    dept1: str
    dept2: str
    closeness: Closeness
    reason: str

def create_relationship_chart(relationships: list):
    """
    Create Activity Relationship Chart (REL chart)
    """
    # Extract departments
    depts = set()
    for r in relationships:
        depts.add(r.dept1)
        depts.add(r.dept2)
    depts = sorted(list(depts))

    # Create relationship matrix
    n = len(depts)
    rel_matrix = {}

    for r in relationships:
        key = (r.dept1, r.dept2) if r.dept1 < r.dept2 else (r.dept2, r.dept1)
        rel_matrix[key] = {
            "closeness": r.closeness.name,
            "reason": r.reason
        }

    # Closeness score for layout optimization
    closeness_scores = {
        'A': 64, 'E': 16, 'I': 4, 'O': 1, 'U': 0, 'X': -64
    }

    # Create numeric matrix for algorithms
    score_matrix = np.zeros((n, n))
    dept_idx = {d: i for i, d in enumerate(depts)}

    for (d1, d2), rel in rel_matrix.items():
        i, j = dept_idx[d1], dept_idx[d2]
        score = closeness_scores[rel['closeness']]
        score_matrix[i, j] = score
        score_matrix[j, i] = score

    return {
        "departments": depts,
        "relationships": rel_matrix,
        "score_matrix": pd.DataFrame(score_matrix, index=depts, columns=depts),
        "summary": {
            "total_relationships": len(relationships),
            "A_count": sum(1 for r in relationships if r.closeness == Closeness.A),
            "X_count": sum(1 for r in relationships if r.closeness == Closeness.X)
        }
    }
```

### 3. CRAFT Algorithm

```python
def craft_algorithm(initial_layout: np.ndarray, flow_matrix: np.ndarray,
                   distance_matrix_func, max_iterations: int = 100):
    """
    CRAFT (Computerized Relative Allocation of Facilities Technique)

    Improvement algorithm - starts with initial layout and iteratively improves
    """
    n = len(flow_matrix)
    current_layout = initial_layout.copy()

    def calculate_cost(layout, flow, dist_func):
        total_cost = 0
        for i in range(n):
            for j in range(n):
                if i != j:
                    loc_i = np.argwhere(layout == i)[0]
                    loc_j = np.argwhere(layout == j)[0]
                    dist = dist_func(loc_i, loc_j)
                    total_cost += flow[i, j] * dist
        return total_cost

    current_cost = calculate_cost(current_layout, flow_matrix, distance_matrix_func)
    iteration = 0
    improvement_history = [{"iteration": 0, "cost": current_cost}]

    while iteration < max_iterations:
        best_swap = None
        best_cost = current_cost

        # Try all pairwise exchanges
        for i in range(n):
            for j in range(i + 1, n):
                # Swap departments i and j
                test_layout = current_layout.copy()
                pos_i = np.argwhere(test_layout == i)[0]
                pos_j = np.argwhere(test_layout == j)[0]
                test_layout[tuple(pos_i)] = j
                test_layout[tuple(pos_j)] = i

                test_cost = calculate_cost(test_layout, flow_matrix, distance_matrix_func)

                if test_cost < best_cost:
                    best_cost = test_cost
                    best_swap = (i, j)

        if best_swap is None:
            break  # No improvement found

        # Apply best swap
        i, j = best_swap
        pos_i = np.argwhere(current_layout == i)[0]
        pos_j = np.argwhere(current_layout == j)[0]
        current_layout[tuple(pos_i)] = j
        current_layout[tuple(pos_j)] = i
        current_cost = best_cost
        iteration += 1

        improvement_history.append({
            "iteration": iteration,
            "swap": best_swap,
            "cost": current_cost
        })

    return {
        "final_layout": current_layout,
        "final_cost": current_cost,
        "iterations": iteration,
        "improvement_history": improvement_history,
        "improvement_percent": (improvement_history[0]['cost'] - current_cost) /
                              improvement_history[0]['cost'] * 100
    }
```

### 4. Block Layout Generation

```python
def generate_block_layout(departments: list, space_requirements: dict,
                         facility_dimensions: tuple, rel_chart: dict):
    """
    Generate block layout from space requirements
    """
    width, height = facility_dimensions
    total_space = width * height

    # Calculate space allocation
    total_required = sum(space_requirements.values())

    layouts = []

    # Simple strip-based layout
    x_pos = 0
    y_pos = 0
    max_height_in_row = 0

    for dept in departments:
        required = space_requirements.get(dept, 100)
        # Calculate block dimensions (roughly square)
        block_width = np.sqrt(required)
        block_height = required / block_width

        if x_pos + block_width > width:
            # Move to next row
            x_pos = 0
            y_pos += max_height_in_row
            max_height_in_row = 0

        layouts.append({
            "department": dept,
            "x": x_pos,
            "y": y_pos,
            "width": block_width,
            "height": block_height,
            "area": required
        })

        x_pos += block_width
        max_height_in_row = max(max_height_in_row, block_height)

    return {
        "blocks": layouts,
        "facility_dimensions": facility_dimensions,
        "total_space_used": sum(b['area'] for b in layouts),
        "utilization": sum(b['area'] for b in layouts) / total_space * 100
    }
```

### 5. Layout Evaluation

```python
def evaluate_layout(layout: list, flow_data: dict, rel_chart: dict):
    """
    Evaluate layout quality
    """
    # Calculate centroids
    centroids = {}
    for block in layout:
        centroids[block['department']] = (
            block['x'] + block['width'] / 2,
            block['y'] + block['height'] / 2
        )

    # Calculate total material handling cost
    def euclidean_dist(c1, c2):
        return np.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2)

    def rectilinear_dist(c1, c2):
        return abs(c1[0] - c2[0]) + abs(c1[1] - c2[1])

    total_flow_cost = 0
    flow_matrix = flow_data.get('flow_matrix', pd.DataFrame())

    for dept1 in centroids:
        for dept2 in centroids:
            if dept1 != dept2 and dept1 in flow_matrix.index and dept2 in flow_matrix.columns:
                flow = flow_matrix.loc[dept1, dept2]
                dist = rectilinear_dist(centroids[dept1], centroids[dept2])
                total_flow_cost += flow * dist

    # Check relationship satisfaction
    rel_score = 0
    score_matrix = rel_chart.get('score_matrix', pd.DataFrame())

    for dept1 in centroids:
        for dept2 in centroids:
            if dept1 < dept2 and dept1 in score_matrix.index:
                target_score = score_matrix.loc[dept1, dept2]
                dist = rectilinear_dist(centroids[dept1], centroids[dept2])
                # Adjacent if distance < threshold
                is_adjacent = dist < 50  # Threshold
                if target_score > 0 and is_adjacent:
                    rel_score += target_score
                elif target_score < 0 and not is_adjacent:
                    rel_score -= target_score  # Good that they're apart

    # Space utilization
    total_area = max(b['x'] + b['width'] for b in layout) * \
                 max(b['y'] + b['height'] for b in layout)
    used_area = sum(b['area'] for b in layout)

    return {
        "flow_cost": total_flow_cost,
        "relationship_score": rel_score,
        "space_utilization": used_area / total_area * 100,
        "adjacency_satisfaction": rel_score / (len(centroids) * (len(centroids) - 1) / 2),
        "metrics": {
            "total_departments": len(layout),
            "total_area": total_area,
            "used_area": used_area
        }
    }
```

### 6. Aisle Design

```python
def design_aisles(layout: list, traffic_data: dict):
    """
    Design aisle system for layout
    """
    aisles = []

    # Main aisle (runs length of facility)
    main_width = traffic_data.get('main_aisle_width', 12)  # feet
    aisles.append({
        "type": "main",
        "width": main_width,
        "orientation": "horizontal",
        "y_position": max(b['y'] + b['height'] for b in layout) / 2
    })

    # Cross aisles
    cross_width = traffic_data.get('cross_aisle_width', 8)
    num_cross = traffic_data.get('num_cross_aisles', 2)
    facility_width = max(b['x'] + b['width'] for b in layout)

    for i in range(num_cross):
        aisles.append({
            "type": "cross",
            "width": cross_width,
            "orientation": "vertical",
            "x_position": facility_width * (i + 1) / (num_cross + 1)
        })

    # Calculate aisle area
    main_length = facility_width
    cross_length = max(b['y'] + b['height'] for b in layout)

    total_aisle_area = (main_width * main_length +
                       num_cross * cross_width * cross_length)

    return {
        "aisles": aisles,
        "total_aisle_area": total_aisle_area,
        "aisle_percentage": total_aisle_area /
                           (facility_width * cross_length) * 100
    }
```

## Process Integration

This skill integrates with the following processes:
- `warehouse-layout-slotting-optimization.js`
- `workstation-design-optimization.js`

## Output Format

```json
{
  "layout": {
    "blocks": [
      {"department": "Receiving", "x": 0, "y": 0, "width": 50, "height": 40},
      {"department": "Storage", "x": 50, "y": 0, "width": 100, "height": 60}
    ]
  },
  "evaluation": {
    "flow_cost": 15420,
    "relationship_score": 85,
    "space_utilization": 78
  },
  "aisles": {
    "total_area": 1200,
    "percentage": 12
  },
  "recommendations": [
    "Swap Shipping and QC to reduce material handling"
  ]
}
```

## Best Practices

1. **Start with relationships** - Define closeness requirements
2. **Quantify flows** - Use actual material handling data
3. **Consider expansion** - Plan for growth
4. **Safety first** - Emergency egress, hazard separation
5. **Validate with users** - Operations input essential
6. **Compare alternatives** - Evaluate multiple options

## Constraints

- Fixed building constraints
- Column locations
- Utility access points
- Building codes and regulations
- Budget limitations
