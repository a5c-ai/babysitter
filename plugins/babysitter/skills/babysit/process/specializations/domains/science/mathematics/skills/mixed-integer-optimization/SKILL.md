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
  - Task
metadata:
  version: "1.0"
  category: optimization
  domain: mathematics
  backlog-id: SK-MATH-018
  tools:
    - Gurobi
    - CPLEX
    - SCIP
    - CBC
  processes:
    - optimization-problem-formulation
---

# Mixed-Integer Optimization Skill

## Purpose

Provides mixed-integer linear and nonlinear programming capabilities for discrete and combinatorial optimization.

## Capabilities

- **Branch and Bound**: Branch and bound/cut algorithms
- **MIP Formulation**: MIP formulation techniques
- **Indicator Constraints**: Handle indicator constraints
- **Big-M Reformulations**: Apply Big-M techniques
- **Lazy Constraints**: Implement lazy constraint callbacks
- **Solution Pools**: Generate multiple solutions

## Usage Guidelines

1. **Formulation**
   - Choose tight formulations
   - Avoid unnecessary big-M
   - Use indicator constraints when available

2. **Solver Tuning**
   - Configure branching priorities
   - Set appropriate MIP gaps
   - Use cuts selectively

3. **Advanced Features**
   - Implement custom callbacks
   - Use warm starting
   - Generate solution pools

4. **Best Practices**
   - Compare formulation strength
   - Presolve before solving
   - Document solution quality
