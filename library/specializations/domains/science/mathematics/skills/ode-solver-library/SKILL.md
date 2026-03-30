---
name: ode-solver-library
description: Numerical methods for ordinary differential equations
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

# ODE Solver Library

## Purpose

Provides numerical methods and solvers for ordinary differential equations in mathematical modeling and dynamical systems analysis.

## Capabilities

- Runge-Kutta methods (explicit and implicit)
- Multistep methods (Adams-Bashforth, BDF)
- Stiff equation handling
- Adaptive step size control
- Event detection and root finding
- Sensitivity analysis

## Usage Guidelines

1. **Stiffness Assessment**: Determine if problem is stiff
2. **Method Selection**: Choose explicit or implicit methods accordingly
3. **Tolerance Setting**: Set appropriate error tolerances
4. **Event Handling**: Configure event detection for discontinuities

## Tools/Libraries

- SUNDIALS
- scipy.integrate
- DifferentialEquations.jl
