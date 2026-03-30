---
name: linear-programming-solver
description: Linear programming skill for resource allocation, scheduling, and optimization problems
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
  shared-candidate: true
  tools-libraries:
    - pulp
    - ortools
    - pyomo
    - cvxpy
---

# Linear Programming Solver

## Overview

The Linear Programming Solver skill provides comprehensive capabilities for formulating and solving linear optimization problems. It supports resource allocation, production planning, scheduling, and other business optimization challenges through efficient solver integration and solution analysis.

## Capabilities

- LP model formulation assistance
- Solver integration (GLPK, CBC, CPLEX, Gurobi)
- Sensitivity analysis (shadow prices, reduced costs)
- Infeasibility diagnosis
- Unboundedness detection
- Integer programming support
- Multi-objective LP (goal programming)
- Solution interpretation

## Used By Processes

- Prescriptive Analytics and Optimization
- Resource Allocation
- Supply Chain Optimization

## Usage

### Problem Formulation

```python
# Define LP problem
lp_problem = {
    "name": "Production Planning",
    "sense": "maximize",  # or "minimize"
    "decision_variables": {
        "product_A": {"type": "continuous", "lower_bound": 0, "upper_bound": 1000},
        "product_B": {"type": "continuous", "lower_bound": 0, "upper_bound": 800},
        "product_C": {"type": "integer", "lower_bound": 0}  # integer variable
    },
    "objective": {
        "expression": "50*product_A + 40*product_B + 60*product_C",
        "description": "Maximize total profit"
    },
    "constraints": [
        {
            "name": "labor_hours",
            "expression": "2*product_A + 3*product_B + 4*product_C <= 2400",
            "description": "Total labor hours available"
        },
        {
            "name": "machine_time",
            "expression": "3*product_A + 2*product_B + 3*product_C <= 2000",
            "description": "Machine time capacity"
        },
        {
            "name": "raw_material",
            "expression": "product_A + product_B + product_C <= 1200",
            "description": "Raw material availability"
        },
        {
            "name": "demand_A",
            "expression": "product_A >= 100",
            "description": "Minimum demand for product A"
        }
    ]
}
```

### Solver Configuration

```python
# Solver settings
solver_config = {
    "solver": "CBC",  # or "GLPK", "CPLEX", "GUROBI"
    "time_limit": 300,  # seconds
    "mip_gap": 0.01,  # 1% optimality gap for MIP
    "threads": 4,
    "presolve": True,
    "cuts": "automatic"
}
```

### Sensitivity Analysis

```python
# Request sensitivity information
sensitivity_config = {
    "shadow_prices": True,
    "reduced_costs": True,
    "allowable_ranges": True,
    "what_if": [
        {"constraint": "labor_hours", "change": 100},
        {"objective_coeff": "product_A", "change": 5}
    ]
}
```

## Common LP Problem Types

| Problem Type | Objective | Key Constraints |
|-------------|-----------|-----------------|
| Production Planning | Maximize profit | Capacity, demand |
| Transportation | Minimize cost | Supply, demand |
| Assignment | Minimize cost/time | One-to-one matching |
| Blending | Minimize cost | Quality specs, availability |
| Network Flow | Min cost/max flow | Flow balance, capacity |
| Portfolio | Maximize return | Risk, budget, diversification |

## Input Schema

```json
{
  "problem_definition": {
    "name": "string",
    "sense": "maximize|minimize",
    "decision_variables": "object",
    "objective": {
      "expression": "string",
      "description": "string"
    },
    "constraints": ["object"]
  },
  "solver_config": {
    "solver": "string",
    "time_limit": "number",
    "mip_gap": "number"
  },
  "analysis_options": {
    "sensitivity": "boolean",
    "what_if": ["object"],
    "report_format": "string"
  }
}
```

## Output Schema

```json
{
  "status": "Optimal|Infeasible|Unbounded|TimeLimit",
  "objective_value": "number",
  "solution": {
    "variable_name": "number"
  },
  "sensitivity": {
    "shadow_prices": {
      "constraint_name": {
        "value": "number",
        "allowable_increase": "number",
        "allowable_decrease": "number"
      }
    },
    "reduced_costs": {
      "variable_name": {
        "value": "number",
        "allowable_increase": "number",
        "allowable_decrease": "number"
      }
    }
  },
  "infeasibility_analysis": {
    "conflicting_constraints": ["string"],
    "suggested_relaxations": ["object"]
  },
  "what_if_results": ["object"],
  "solve_time": "number"
}
```

## Sensitivity Interpretation

| Metric | Meaning | Use |
|--------|---------|-----|
| Shadow Price | Value of relaxing constraint by 1 unit | Prioritize constraint relief |
| Reduced Cost | Cost of forcing non-basic variable into solution | Evaluate non-optimal alternatives |
| Allowable Range | Range where basis stays optimal | Assess stability of solution |

## Best Practices

1. Verify model formulation with simple test cases
2. Check units consistency in coefficients
3. Analyze infeasibility before debugging manually
4. Use shadow prices to guide resource acquisition
5. Consider integer programming only when necessary (harder to solve)
6. Validate solution against business constraints
7. Document model assumptions clearly

## Infeasibility Handling

When model is infeasible:
1. Identify Irreducible Infeasible Subset (IIS)
2. Relax constraints using elastic variables
3. Prioritize constraint satisfaction
4. Use goal programming for conflicting objectives

## Integration Points

- Feeds into Optimization Specialist agent
- Connects with Sensitivity Analyzer for robustness
- Supports Constraint Satisfaction Solver for hybrid problems
- Integrates with Decision Visualization for solution display
