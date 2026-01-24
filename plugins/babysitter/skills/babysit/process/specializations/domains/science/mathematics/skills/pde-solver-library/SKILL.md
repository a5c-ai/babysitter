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
  - Task
metadata:
  version: "1.0"
  category: numerical-analysis
  domain: mathematics
  backlog-id: SK-MATH-012
  tools:
    - FEniCS
    - deal.II
    - PETSc
    - Firedrake
  processes:
    - pde-solver-selection
    - numerical-stability-analysis
---

# PDE Solver Library Skill

## Purpose

Provides numerical methods for solving partial differential equations using finite difference, finite element, and spectral methods.

## Capabilities

- **Finite Difference**: Explicit, implicit, Crank-Nicolson schemes
- **Finite Element**: FEM with various element types
- **Finite Volume**: Conservation-form discretizations
- **Spectral Methods**: Fourier and Chebyshev spectral methods
- **Mesh Operations**: Mesh generation and adaptation
- **Stability Analysis**: Stability and convergence analysis

## Usage Guidelines

1. **Method Selection**
   - Match method to PDE type (elliptic, parabolic, hyperbolic)
   - Consider domain geometry
   - Assess accuracy requirements

2. **Discretization**
   - Choose appropriate mesh resolution
   - Select element type for FEM
   - Implement boundary conditions correctly

3. **Solution Process**
   - Select appropriate solver
   - Monitor convergence
   - Validate against known solutions

4. **Best Practices**
   - Perform convergence studies
   - Check conservation properties
   - Document numerical parameters
