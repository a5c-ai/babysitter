---
name: scipy-optimization-toolkit
description: SciPy scientific computing skill for numerical optimization, integration, and signal processing in physics
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
  category: data-analysis
  domain: physics
  tools:
    - SciPy
    - NumPy
    - lmfit
  processes:
    - statistical-analysis-pipeline
    - uncertainty-propagation-and-quantification
    - systematic-uncertainty-evaluation
---

# SciPy Optimization Toolkit Skill

## Purpose

Provides SciPy numerical computing capabilities for optimization, integration, differential equations, and signal processing in physics data analysis applications.

## Capabilities

- **Nonlinear Fitting**: Least squares fitting with curve_fit and minimize
- **Global Optimization**: Basin hopping, differential evolution, dual annealing
- **Numerical Integration**: Quadrature methods for definite integrals
- **ODE/PDE Solvers**: Solve initial and boundary value problems
- **Signal Processing**: FFT, filtering, spectral analysis
- **Sparse Matrices**: Efficient sparse linear algebra operations

## Usage Guidelines

1. **Function Fitting**
   - Define model function with parameters
   - Provide initial parameter guesses
   - Use curve_fit for simple cases
   - Use lmfit for complex models with constraints

2. **Global Optimization**
   - Choose algorithm based on problem structure
   - Set appropriate bounds and constraints
   - Use multiple starting points
   - Validate global minimum

3. **Integration**
   - Choose quadrature method based on integrand
   - Handle singularities appropriately
   - Set tolerance requirements
   - Verify convergence

4. **Differential Equations**
   - Select solver based on problem stiffness
   - Provide Jacobian if available
   - Handle events and discontinuities
   - Validate against known solutions

5. **Best Practices**
   - Check condition numbers
   - Propagate uncertainties correctly
   - Document numerical parameters
   - Validate against analytical solutions
