---
name: mixed-integer-optimization
description: Mixed-integer linear and nonlinear programming
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: optimization
  phase: 6
---

# Mixed-Integer Optimization

## Purpose

Provides capabilities for formulating and solving mixed-integer linear and nonlinear programming problems.

## Capabilities

- Branch and bound/cut algorithms
- MIP formulation techniques
- Indicator constraints
- Big-M reformulations
- Lazy constraints
- Solution pool generation

## Usage Guidelines

1. **Formulation**: Use tight formulations with valid inequalities
2. **Big-M Selection**: Choose appropriate Big-M values
3. **Branching**: Configure branching priorities
4. **Solution Pool**: Generate diverse feasible solutions

## Tools/Libraries

- Gurobi
- CPLEX
- SCIP
- CBC
