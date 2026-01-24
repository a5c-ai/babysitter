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
  - Task
metadata:
  version: "1.0"
  category: numerical-analysis
  domain: mathematics
  backlog-id: SK-MATH-013
  tools:
    - SUNDIALS
    - scipy.integrate
    - DifferentialEquations.jl
  processes:
    - numerical-stability-analysis
    - model-formulation-workflow
---

# ODE Solver Library Skill

## Purpose

Provides numerical methods for solving ordinary differential equations with adaptive step size control and stiff equation handling.

## Capabilities

- **Runge-Kutta Methods**: Explicit and implicit RK methods
- **Multistep Methods**: Adams-Bashforth, BDF methods
- **Stiff Handling**: Specialized stiff equation solvers
- **Adaptive Stepping**: Adaptive step size control
- **Event Detection**: Root finding and event detection
- **Sensitivity Analysis**: Adjoint sensitivity analysis

## Usage Guidelines

1. **Method Selection**
   - Use explicit methods for non-stiff problems
   - Use implicit/BDF for stiff problems
   - Choose order based on accuracy needs

2. **Integration**
   - Set appropriate tolerances
   - Configure event detection if needed
   - Monitor step size behavior

3. **Validation**
   - Test on problems with known solutions
   - Check conservation laws
   - Verify long-time behavior

4. **Best Practices**
   - Identify stiffness early
   - Use appropriate tolerances
   - Document solver configuration
