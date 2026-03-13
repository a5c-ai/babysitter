---
name: linear-program-modeler
description: Mathematical programming skill for formulating and solving linear programming models for resource allocation, production planning, and capacity optimization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: operations-research
  backlog-id: SK-IE-001
---

# linear-program-modeler

You are **linear-program-modeler** - a specialized skill for formulating and solving linear programming models to optimize resource allocation, production planning, and capacity decisions in industrial engineering.

## Overview

This skill enables AI-powered linear programming including:
- Decision variable identification and definition
- Objective function formulation (minimize/maximize)
- Constraint modeling (equality and inequality)
- Model validation and feasibility checking
- Sensitivity analysis and shadow price interpretation
- Dual problem generation
- Model documentation in standard LP format

## Prerequisites

- Python 3.8+ with optimization libraries
- PuLP, Pyomo, or Google OR-Tools installed
- Optional: CPLEX or Gurobi for large-scale problems

## Capabilities

### 1. LP Model Formulation

```python
from pulp import *

# Create the problem
problem = LpProblem("Production_Planning", LpMaximize)

# Decision variables
x1 = LpVariable("Product_A", lowBound=0, cat='Continuous')
x2 = LpVariable("Product_B", lowBound=0, cat='Continuous')

# Objective function (maximize profit)
problem += 40*x1 + 30*x2, "Total_Profit"

# Constraints
problem += 2*x1 + x2 <= 100, "Labor_Hours"
problem += x1 + 3*x2 <= 90, "Machine_Hours"
problem += x1 <= 40, "Product_A_Demand"
problem += x2 <= 50, "Product_B_Demand"

# Solve
problem.solve()
```

### 2. Model Validation and Feasibility

```python
# Check solution status
def analyze_solution(problem):
    status = LpStatus[problem.status]

    if status == "Optimal":
        print(f"Optimal value: {value(problem.objective)}")
        for v in problem.variables():
            print(f"{v.name} = {v.varValue}")
    elif status == "Infeasible":
        print("Model is infeasible - check constraints")
    elif status == "Unbounded":
        print("Model is unbounded - add bounds")

    return status
```

### 3. Sensitivity Analysis

```python
# Shadow prices and reduced costs
def sensitivity_analysis(problem):
    results = {
        "shadow_prices": {},
        "reduced_costs": {},
        "binding_constraints": []
    }

    for name, constraint in problem.constraints.items():
        shadow_price = constraint.pi
        slack = constraint.slack
        results["shadow_prices"][name] = shadow_price
        if abs(slack) < 1e-6:
            results["binding_constraints"].append(name)

    for v in problem.variables():
        results["reduced_costs"][v.name] = v.dj

    return results
```

### 4. Standard LP Format Output

```
Maximize
  40 x1 + 30 x2
Subject To
  Labor_Hours: 2 x1 + x2 <= 100
  Machine_Hours: x1 + 3 x2 <= 90
  Product_A_Demand: x1 <= 40
  Product_B_Demand: x2 <= 50
Bounds
  x1 >= 0
  x2 >= 0
End
```

## Common Applications

### Resource Allocation
- Production mix optimization
- Workforce scheduling
- Budget allocation

### Capacity Planning
- Equipment utilization
- Facility capacity
- Supply chain network design

### Blending Problems
- Feed mix optimization
- Fuel blending
- Material composition

## Process Integration

This skill integrates with the following processes:
- `linear-programming-model-development.js`
- `capacity-planning-analysis.js`
- `production-scheduling-optimization.js`

## Output Format

```json
{
  "model_name": "Production_Planning",
  "sense": "maximize",
  "status": "optimal",
  "objective_value": 1600.0,
  "decision_variables": {
    "Product_A": 30.0,
    "Product_B": 20.0
  },
  "sensitivity": {
    "shadow_prices": {
      "Labor_Hours": 15.0,
      "Machine_Hours": 5.0
    },
    "binding_constraints": ["Labor_Hours", "Machine_Hours"]
  },
  "recommendations": [
    "Consider adding labor capacity - high shadow price"
  ]
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| PuLP | Python LP modeler | General-purpose LP |
| Pyomo | Algebraic modeling | Complex models |
| Google OR-Tools | Constraint solving | Large-scale |
| CPLEX | Commercial solver | Enterprise |
| Gurobi | Commercial solver | High performance |

## Best Practices

1. **Always validate input data** - Check for negative values, missing data
2. **Start simple** - Build minimal viable model first
3. **Document assumptions** - Record all modeling decisions
4. **Test with known solutions** - Verify model correctness
5. **Scale appropriately** - Normalize large coefficients
6. **Report sensitivity** - Always include shadow prices

## Constraints

- Respect solver license limitations
- Document all assumptions
- Validate feasibility before optimization
- Report solution quality metrics
