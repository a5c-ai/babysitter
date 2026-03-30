---
name: line-balancer
description: Assembly line balancing skill for workstation design and cycle time optimization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: production-planning
  backlog-id: SK-IE-030
---

# line-balancer

You are **line-balancer** - a specialized skill for assembly line balancing including workstation design, task assignment, and cycle time optimization.

## Overview

This skill enables AI-powered line balancing including:
- Precedence diagram analysis
- Cycle time calculation from demand
- Workstation assignment algorithms
- Line efficiency calculation
- Balance delay minimization
- Single and multi-model line balancing
- Mixed-model sequencing
- U-line balancing

## Capabilities

### 1. Precedence Diagram Analysis

```python
import networkx as nx
import pandas as pd
from collections import defaultdict

def analyze_precedence(tasks: list, precedence: list):
    """
    Analyze precedence relationships for line balancing

    tasks: list of {'task_id': str, 'time': float, 'description': str}
    precedence: list of (predecessor, successor) tuples
    """
    # Build directed graph
    G = nx.DiGraph()

    task_dict = {t['task_id']: t for t in tasks}
    for task in tasks:
        G.add_node(task['task_id'], time=task['time'])

    for pred, succ in precedence:
        G.add_edge(pred, succ)

    # Calculate position weights (sum of task time and all successors)
    def positional_weight(node):
        descendants = nx.descendants(G, node)
        weight = task_dict[node]['time']
        for d in descendants:
            weight += task_dict[d]['time']
        return weight

    weights = {t['task_id']: positional_weight(t['task_id']) for t in tasks}

    # Find critical path
    total_time = sum(t['time'] for t in tasks)

    # Find immediate predecessors and successors
    analysis = []
    for task in tasks:
        tid = task['task_id']
        analysis.append({
            'task_id': tid,
            'time': task['time'],
            'predecessors': list(G.predecessors(tid)),
            'successors': list(G.successors(tid)),
            'positional_weight': weights[tid]
        })

    return {
        "total_work_content": total_time,
        "task_analysis": pd.DataFrame(analysis).sort_values('positional_weight', ascending=False),
        "graph": G
    }
```

### 2. Cycle Time and Workstation Calculation

```python
def calculate_cycle_time(demand_per_shift: int, available_time_minutes: float,
                        efficiency: float = 0.95):
    """
    Calculate required cycle time from demand

    Returns theoretical and practical cycle times
    """
    # Theoretical cycle time
    theoretical_ct = available_time_minutes / demand_per_shift

    # Practical cycle time (accounting for efficiency)
    practical_ct = theoretical_ct * efficiency

    return {
        "theoretical_cycle_time": round(theoretical_ct, 2),
        "practical_cycle_time": round(practical_ct, 2),
        "demand_per_shift": demand_per_shift,
        "available_time": available_time_minutes,
        "efficiency_factor": efficiency
    }

def calculate_workstations(total_work_content: float, cycle_time: float):
    """
    Calculate theoretical and actual number of workstations
    """
    theoretical = total_work_content / cycle_time
    minimum = int(np.ceil(theoretical))

    return {
        "theoretical_workstations": round(theoretical, 2),
        "minimum_workstations": minimum,
        "total_work_content": total_work_content,
        "cycle_time": cycle_time
    }
```

### 3. Largest Candidate Rule (LCR)

```python
def largest_candidate_rule(tasks: list, precedence: list, cycle_time: float):
    """
    Line balancing using Largest Candidate Rule

    Assigns tasks to workstations by largest task time first
    """
    # Build precedence graph
    G = nx.DiGraph()
    for pred, succ in precedence:
        G.add_edge(pred, succ)

    task_dict = {t['task_id']: t['time'] for t in tasks}

    # Sort tasks by time descending
    sorted_tasks = sorted(tasks, key=lambda x: x['time'], reverse=True)

    workstations = []
    assigned = set()
    current_station = 1
    current_time = 0
    current_tasks = []

    while len(assigned) < len(tasks):
        task_assigned = False

        for task in sorted_tasks:
            tid = task['task_id']

            if tid in assigned:
                continue

            # Check precedence - all predecessors must be assigned
            predecessors = set(G.predecessors(tid))
            if not predecessors.issubset(assigned):
                continue

            # Check if task fits in current station
            if current_time + task['time'] <= cycle_time:
                current_tasks.append(tid)
                current_time += task['time']
                assigned.add(tid)
                task_assigned = True
                break

        if not task_assigned:
            # Close current station and start new one
            if current_tasks:
                workstations.append({
                    'station': current_station,
                    'tasks': current_tasks,
                    'total_time': current_time,
                    'idle_time': cycle_time - current_time
                })
                current_station += 1
                current_time = 0
                current_tasks = []

    # Add last station if not empty
    if current_tasks:
        workstations.append({
            'station': current_station,
            'tasks': current_tasks,
            'total_time': current_time,
            'idle_time': cycle_time - current_time
        })

    return {
        "workstations": workstations,
        "num_stations": len(workstations),
        "cycle_time": cycle_time
    }
```

### 4. Ranked Positional Weight (RPW)

```python
def ranked_positional_weight(tasks: list, precedence: list, cycle_time: float):
    """
    Line balancing using Ranked Positional Weight method

    Better than LCR as it considers both task time and position
    """
    # Build graph and calculate positional weights
    G = nx.DiGraph()
    for pred, succ in precedence:
        G.add_edge(pred, succ)

    task_dict = {t['task_id']: t for t in tasks}

    def calc_rpw(task_id):
        descendants = nx.descendants(G, task_id)
        weight = task_dict[task_id]['time']
        for d in descendants:
            weight += task_dict[d]['time']
        return weight

    # Add RPW to tasks and sort
    for task in tasks:
        task['rpw'] = calc_rpw(task['task_id'])

    sorted_tasks = sorted(tasks, key=lambda x: x['rpw'], reverse=True)

    # Assign to workstations
    workstations = []
    assigned = set()
    current_station = 1
    current_time = 0
    current_tasks = []

    while len(assigned) < len(tasks):
        task_assigned = False

        for task in sorted_tasks:
            tid = task['task_id']

            if tid in assigned:
                continue

            # Check precedence
            predecessors = set(G.predecessors(tid))
            if not predecessors.issubset(assigned):
                continue

            # Check fit
            if current_time + task['time'] <= cycle_time:
                current_tasks.append({
                    'task_id': tid,
                    'time': task['time'],
                    'rpw': task['rpw']
                })
                current_time += task['time']
                assigned.add(tid)
                task_assigned = True

        if not task_assigned:
            if current_tasks:
                workstations.append({
                    'station': current_station,
                    'tasks': current_tasks,
                    'total_time': current_time,
                    'idle_time': cycle_time - current_time,
                    'utilization': current_time / cycle_time * 100
                })
                current_station += 1
                current_time = 0
                current_tasks = []

    if current_tasks:
        workstations.append({
            'station': current_station,
            'tasks': current_tasks,
            'total_time': current_time,
            'idle_time': cycle_time - current_time,
            'utilization': current_time / cycle_time * 100
        })

    return {
        "workstations": workstations,
        "num_stations": len(workstations),
        "cycle_time": cycle_time,
        "method": "RPW"
    }
```

### 5. Line Efficiency Metrics

```python
def calculate_line_efficiency(workstations: list, cycle_time: float, total_work_content: float):
    """
    Calculate line balancing efficiency metrics
    """
    num_stations = len(workstations)

    # Line efficiency (balance efficiency)
    line_efficiency = (total_work_content / (num_stations * cycle_time)) * 100

    # Balance delay
    balance_delay = 100 - line_efficiency

    # Smoothness index
    station_times = [ws['total_time'] for ws in workstations]
    mean_time = np.mean(station_times)
    smoothness = np.sqrt(sum((t - mean_time)**2 for t in station_times))

    # Station utilization
    utilizations = [ws['total_time'] / cycle_time * 100 for ws in workstations]

    return {
        "line_efficiency": round(line_efficiency, 2),
        "balance_delay": round(balance_delay, 2),
        "smoothness_index": round(smoothness, 2),
        "num_stations": num_stations,
        "cycle_time": cycle_time,
        "station_utilizations": utilizations,
        "min_utilization": round(min(utilizations), 2),
        "max_utilization": round(max(utilizations), 2),
        "avg_utilization": round(np.mean(utilizations), 2)
    }
```

### 6. Mixed-Model Line Balancing

```python
def mixed_model_balance(models: list, tasks: dict, precedence: dict,
                       demand_ratio: dict, cycle_time: float):
    """
    Balance a mixed-model assembly line

    models: list of model IDs
    tasks: {model: [{'task_id': str, 'time': float}]}
    precedence: {model: [(pred, succ)]}
    demand_ratio: {model: proportion of demand}
    """
    # Calculate weighted average task times
    weighted_tasks = defaultdict(float)

    for model in models:
        ratio = demand_ratio[model]
        for task in tasks[model]:
            weighted_tasks[task['task_id']] += task['time'] * ratio

    # Create combined task list
    combined_tasks = [
        {'task_id': tid, 'time': time}
        for tid, time in weighted_tasks.items()
    ]

    # Combine precedence relationships
    combined_precedence = set()
    for model in models:
        for pred, succ in precedence[model]:
            combined_precedence.add((pred, succ))

    # Balance using weighted times
    result = ranked_positional_weight(
        combined_tasks,
        list(combined_precedence),
        cycle_time
    )

    return {
        "mixed_model_balance": result,
        "models": models,
        "demand_ratios": demand_ratio,
        "weighted_work_content": sum(weighted_tasks.values())
    }
```

## Process Integration

This skill integrates with the following processes:
- `assembly-line-design.js`
- `production-scheduling-optimization.js`
- `workstation-design-optimization.js`

## Output Format

```json
{
  "line_balance": {
    "workstations": [
      {"station": 1, "tasks": ["A", "B"], "total_time": 48, "idle_time": 2},
      {"station": 2, "tasks": ["C", "D", "E"], "total_time": 47, "idle_time": 3}
    ],
    "cycle_time": 50,
    "method": "RPW"
  },
  "efficiency": {
    "line_efficiency": 95.2,
    "balance_delay": 4.8,
    "smoothness_index": 2.1
  },
  "recommendations": [
    "Consider combining tasks B and C to improve balance",
    "Station 4 is bottleneck - consider task splitting"
  ]
}
```

## Best Practices

1. **Validate precedence** - Ensure all relationships captured
2. **Consider multiple algorithms** - Compare LCR, RPW, other methods
3. **Account for variability** - Task times vary in practice
4. **Allow for learning** - New lines improve over time
5. **Design for flexibility** - Future model changes
6. **Include ergonomics** - Workstation design matters

## Constraints

- Precedence constraints limit assignment options
- Task splitting may not be feasible
- Parallel stations add complexity
- Mixed models require careful sequencing
