---
name: integer-program-solver
description: Integer and mixed-integer programming skill for combinatorial optimization problems with discrete decision variables.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: operations-research
  backlog-id: SK-IE-002
---

# integer-program-solver

You are **integer-program-solver** - a specialized skill for formulating and solving integer and mixed-integer programming models for combinatorial optimization problems.

## Overview

This skill enables AI-powered integer programming including:
- Binary and integer variable modeling
- Big-M constraint formulation
- Logical constraint linearization
- Branch and bound solution tracking
- MIP gap analysis and convergence monitoring
- Warm start solution injection
- Solution pool generation

## Prerequisites

- Python 3.8+ with optimization libraries
- Google OR-Tools, Gurobi, or CPLEX installed
- Understanding of combinatorial optimization

## Capabilities

### 1. Binary Variable Modeling

```python
from ortools.linear_solver import pywraplp

def facility_location():
    solver = pywraplp.Solver.CreateSolver('SCIP')

    # Binary variables: open facility j?
    facilities = range(5)
    customers = range(10)

    y = {j: solver.BoolVar(f'y_{j}') for j in facilities}
    x = {(i,j): solver.BoolVar(f'x_{i}_{j}')
         for i in customers for j in facilities}

    # Each customer assigned to exactly one facility
    for i in customers:
        solver.Add(sum(x[i,j] for j in facilities) == 1)

    # Can only assign to open facilities
    for i in customers:
        for j in facilities:
            solver.Add(x[i,j] <= y[j])

    # Objective: minimize total cost
    fixed_cost = [100, 120, 110, 130, 90]
    transport_cost = [[...]]  # cost matrix

    solver.Minimize(
        sum(fixed_cost[j] * y[j] for j in facilities) +
        sum(transport_cost[i][j] * x[i,j]
            for i in customers for j in facilities)
    )

    return solver
```

### 2. Big-M Constraint Formulation

```python
# If-then constraints using Big-M
def big_m_constraints(solver, x, y, M=1e6):
    """
    Model: if x > 0 then y = 1
    Linearization: x <= M * y
    """
    solver.Add(x <= M * y)

    # Either-or constraints
    # Either constraint1 OR constraint2
    # c1: a*x <= b + M*(1-z)
    # c2: c*x <= d + M*z
    z = solver.BoolVar('z')
    solver.Add(a*x <= b + M*(1-z))
    solver.Add(c*x <= d + M*z)
```

### 3. Logical Constraint Linearization

```python
def logical_constraints(solver, y1, y2, y3):
    """
    Common logical constraints
    """
    # AND: z = y1 AND y2
    z_and = solver.BoolVar('z_and')
    solver.Add(z_and <= y1)
    solver.Add(z_and <= y2)
    solver.Add(z_and >= y1 + y2 - 1)

    # OR: z = y1 OR y2
    z_or = solver.BoolVar('z_or')
    solver.Add(z_or >= y1)
    solver.Add(z_or >= y2)
    solver.Add(z_or <= y1 + y2)

    # Implication: y1 => y2
    solver.Add(y1 <= y2)

    # At most one: sum(y) <= 1
    solver.Add(y1 + y2 + y3 <= 1)

    # Exactly one: sum(y) == 1
    solver.Add(y1 + y2 + y3 == 1)
```

### 4. MIP Gap Monitoring

```python
def solve_with_gap_tracking(solver, time_limit=300):
    solver.SetTimeLimit(time_limit * 1000)

    # Set MIP gap tolerance
    solver.SetSolverSpecificParametersAsString(
        "limits/gap = 0.01"  # 1% optimality gap
    )

    status = solver.Solve()

    result = {
        "status": status,
        "objective": solver.Objective().Value(),
        "best_bound": solver.Objective().BestBound(),
        "gap": (solver.Objective().Value() -
                solver.Objective().BestBound()) /
               solver.Objective().Value() * 100,
        "nodes_explored": solver.nodes(),
        "time": solver.WallTime() / 1000
    }

    return result
```

### 5. Solution Pool Generation

```python
def generate_solution_pool(model, max_solutions=10):
    """
    Generate multiple near-optimal solutions
    """
    solutions = []

    for i in range(max_solutions):
        status = model.solve()

        if status == pywraplp.Solver.OPTIMAL:
            solution = {
                "objective": model.Objective().Value(),
                "variables": {v.name(): v.solution_value()
                             for v in model.variables()}
            }
            solutions.append(solution)

            # Add constraint to exclude this solution
            exclude = sum(v if v.solution_value() > 0.5 else (1-v)
                         for v in binary_vars)
            model.Add(exclude <= len(binary_vars) - 1)
        else:
            break

    return solutions
```

## Common Applications

### Facility Location
- Warehouse location
- Hub-and-spoke networks
- Coverage problems

### Scheduling
- Job shop scheduling
- Vehicle routing
- Crew scheduling

### Assignment
- Task assignment
- Resource matching
- Set covering

## Process Integration

This skill integrates with the following processes:
- `linear-programming-model-development.js`
- `transportation-route-optimization.js`
- `warehouse-layout-slotting-optimization.js`

## Output Format

```json
{
  "model_name": "Facility_Location",
  "status": "optimal",
  "objective_value": 4520.0,
  "mip_gap": 0.0,
  "solve_time_seconds": 12.5,
  "nodes_explored": 1547,
  "solution": {
    "open_facilities": [0, 2, 4],
    "assignments": {
      "customer_0": "facility_2",
      "customer_1": "facility_0"
    }
  },
  "solution_pool_size": 5
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| Google OR-Tools | Open source | General MIP |
| Gurobi | Commercial | High performance |
| CPLEX | Commercial | Enterprise |
| SCIP | Open source | Research |
| CBC | Open source | General purpose |

## Best Practices

1. **Tight formulations** - Prefer tight constraints over loose ones
2. **Valid inequalities** - Add cuts when possible
3. **Warm starts** - Provide initial solutions
4. **Symmetry breaking** - Reduce symmetric solutions
5. **Variable branching** - Choose good branching variables
6. **Time limits** - Set reasonable solve times

## Constraints

- Monitor solution quality via MIP gap
- Document all linearization techniques
- Test with small instances first
- Consider heuristics for large problems
