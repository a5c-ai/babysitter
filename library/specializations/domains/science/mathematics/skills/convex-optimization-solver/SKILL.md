---
name: convex-optimization-solver
description: Solve convex optimization problems efficiently
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
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:np-hard-heuristics, skill-area:mathematical-reasoning, skill-area:dynamic-programming]
  workflows: [workflow:experiment-design]
  roles: [role:computational-scientist, role:research-engineer]
---

# Convex Optimization Solver

## Purpose

Provides capabilities for formulating and solving convex optimization problems efficiently and reliably.

## Capabilities

- Linear programming (LP)
- Quadratic programming (QP)
- Second-order cone programming (SOCP)
- Semidefinite programming (SDP)
- Conic optimization
- Duality analysis

## Usage Guidelines

1. **Convexity Verification**: Confirm problem convexity
2. **Formulation**: Express problem in standard conic form
3. **Solver Selection**: Choose solver based on problem structure
4. **Duality**: Extract dual variables for sensitivity analysis

## Tools/Libraries

- CVXPY
- Gurobi
- MOSEK
- SCS
- ECOS
