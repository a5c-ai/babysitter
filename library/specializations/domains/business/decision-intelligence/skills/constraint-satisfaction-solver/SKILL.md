---
name: constraint-satisfaction-solver
description: Constraint programming skill for scheduling, configuration, and assignment problems
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: optimization
  priority: medium
  tools-libraries:
    - ortools
    - python-constraint
    - minizinc-python
---

# Constraint Satisfaction Solver

## Overview

The Constraint Satisfaction Solver skill provides capabilities for solving constraint satisfaction problems (CSPs) and constraint optimization problems (COPs). It excels at scheduling, configuration, assignment, and combinatorial problems where finding feasible solutions is as important as optimization.

## Capabilities

- Variable and domain definition
- Constraint specification (global constraints)
- Solution search strategies
- Optimization with constraints
- Scheduling constraint handling
- Configuration problem solving
- All-solutions enumeration
- Constraint propagation explanation

## Used By Processes

- Prescriptive Analytics and Optimization
- Resource Scheduling
- Operational Decisions

## Usage

### Problem Definition

```python
# Define CSP
csp_problem = {
    "name": "Employee Scheduling",
    "variables": {
        "shift_mon_morning": {"domain": ["Alice", "Bob", "Carol", "David"]},
        "shift_mon_afternoon": {"domain": ["Alice", "Bob", "Carol", "David"]},
        "shift_tue_morning": {"domain": ["Alice", "Bob", "Carol", "David"]},
        "shift_tue_afternoon": {"domain": ["Alice", "Bob", "Carol", "David"]},
        # ... more shifts
    },
    "constraints": [
        {
            "type": "all_different",
            "scope": ["shift_mon_morning", "shift_mon_afternoon"],
            "description": "Different employees on same day"
        },
        {
            "type": "not_equal",
            "variables": ["shift_mon_afternoon", "shift_tue_morning"],
            "condition": "employee",
            "description": "No back-to-back closing/opening"
        },
        {
            "type": "count",
            "variable": "Alice",
            "min": 3,
            "max": 5,
            "description": "Alice works 3-5 shifts per week"
        }
    ]
}
```

### Scheduling Constraints

```python
# Job shop scheduling
scheduling_problem = {
    "jobs": [
        {
            "id": "Job1",
            "tasks": [
                {"id": "J1_T1", "machine": "M1", "duration": 3},
                {"id": "J1_T2", "machine": "M2", "duration": 2, "after": "J1_T1"}
            ]
        },
        {
            "id": "Job2",
            "tasks": [
                {"id": "J2_T1", "machine": "M2", "duration": 2},
                {"id": "J2_T2", "machine": "M1", "duration": 3, "after": "J2_T1"}
            ]
        }
    ],
    "constraints": {
        "no_overlap": "tasks on same machine cannot overlap",
        "precedence": "tasks must respect ordering within job",
        "deadline": {"Job1": 10, "Job2": 8}
    },
    "objective": "minimize_makespan"  # or "minimize_tardiness"
}
```

### Configuration Problem

```python
# Product configuration
config_problem = {
    "components": {
        "engine": {"options": ["V6", "V8", "Electric"]},
        "transmission": {"options": ["Manual", "Automatic", "CVT"]},
        "wheel_size": {"options": [17, 18, 19, 20]},
        "color": {"options": ["Red", "Blue", "Black", "White"]}
    },
    "constraints": [
        {
            "type": "implication",
            "if": {"engine": "Electric"},
            "then": {"transmission": ["Automatic", "CVT"]},
            "description": "Electric engines don't support manual transmission"
        },
        {
            "type": "incompatible",
            "values": [{"engine": "V6"}, {"wheel_size": 20}],
            "description": "V6 not available with 20-inch wheels"
        }
    ]
}
```

## Global Constraints

| Constraint | Description | Example Use |
|------------|-------------|-------------|
| AllDifferent | All variables take distinct values | Sudoku, assignment |
| Cumulative | Resource usage over time | Scheduling |
| Circuit | Variables form a Hamiltonian circuit | TSP, routing |
| Table | Allowed/forbidden combinations | Configuration |
| Regular | Sequence matches automaton | Shift patterns |
| Cardinality | Count of value occurrences | Workload balance |

## Input Schema

```json
{
  "problem_type": "csp|cop|scheduling|configuration",
  "variables": {
    "var_name": {
      "domain": "array or range",
      "type": "integer|boolean|set"
    }
  },
  "constraints": [
    {
      "type": "string",
      "scope": ["string"],
      "parameters": "object"
    }
  ],
  "objective": {
    "type": "minimize|maximize",
    "expression": "string"
  },
  "search_config": {
    "strategy": "default|first_fail|min_domain",
    "time_limit": "number",
    "all_solutions": "boolean",
    "max_solutions": "number"
  }
}
```

## Output Schema

```json
{
  "status": "Satisfied|Optimal|Infeasible|Unknown",
  "solution": {
    "variable_name": "value"
  },
  "objective_value": "number (if COP)",
  "all_solutions": [
    {"variable_name": "value"}
  ],
  "statistics": {
    "nodes_explored": "number",
    "propagations": "number",
    "backtracks": "number",
    "solve_time": "number"
  },
  "explanation": {
    "unsatisfied_constraints": ["string"],
    "conflict_set": ["string"]
  }
}
```

## Search Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| First Fail | Choose variable with smallest domain | General CSPs |
| Min Domain | Same as first fail | General CSPs |
| Impact | Choose by constraint propagation impact | Large problems |
| Activity | Choose frequently changed variables | Restart searches |
| Random | Random variable/value selection | Diversification |

## Best Practices

1. Define tight domains to reduce search space
2. Use appropriate global constraints (more efficient than decomposed)
3. Add redundant constraints to improve propagation
4. Consider symmetry breaking constraints
5. Use restarts for large, hard problems
6. Profile to identify propagation bottlenecks
7. Validate solutions against business requirements

## Integration Points

- Connects with Linear Programming Solver for hybrid approaches
- Feeds into Optimization Specialist agent
- Supports Scheduling and Assignment processes
- Integrates with Decision Visualization for Gantt charts
