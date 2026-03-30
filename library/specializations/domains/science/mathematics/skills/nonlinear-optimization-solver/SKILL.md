---
name: nonlinear-optimization-solver
description: Solve general nonlinear optimization problems
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

# Nonlinear Optimization Solver

## Purpose

Provides capabilities for solving general nonlinear optimization problems including constrained and unconstrained formulations.

## Capabilities

- Gradient-based methods (BFGS, L-BFGS, CG)
- Newton and quasi-Newton methods
- Interior point methods
- Sequential quadratic programming (SQP)
- Global optimization (basin-hopping, differential evolution)
- Constraint handling

## Usage Guidelines

1. **Starting Point**: Provide good initial guesses
2. **Gradient Information**: Supply gradients when available
3. **Global vs Local**: Choose global methods for multimodal problems
4. **Constraint Handling**: Use appropriate constraint formulations

## Tools/Libraries

- IPOPT
- KNITRO
- NLopt
- scipy.optimize
