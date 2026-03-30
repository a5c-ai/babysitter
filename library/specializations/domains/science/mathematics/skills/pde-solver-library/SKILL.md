---
name: pde-solver-library
description: Numerical methods for partial differential equations
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
  category: numerical-analysis
  phase: 6
---

# PDE Solver Library

## Purpose

Provides numerical methods and solvers for partial differential equations in mathematical modeling and simulation.

## Capabilities

- Finite difference schemes (explicit, implicit, Crank-Nicolson)
- Finite element methods (FEM)
- Finite volume methods
- Spectral methods
- Mesh generation and adaptation
- Stability and convergence analysis

## Usage Guidelines

1. **Method Selection**: Choose method based on PDE type and geometry
2. **Mesh Quality**: Ensure appropriate mesh resolution
3. **Stability Analysis**: Verify CFL conditions and stability
4. **Convergence**: Monitor solution convergence with refinement

## Tools/Libraries

- FEniCS
- deal.II
- PETSc
- Firedrake
