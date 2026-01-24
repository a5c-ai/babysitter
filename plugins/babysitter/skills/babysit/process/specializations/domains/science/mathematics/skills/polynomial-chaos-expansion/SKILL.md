---
name: polynomial-chaos-expansion
description: Polynomial chaos methods for stochastic systems
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
  category: computational-mathematics
  domain: mathematics
  backlog-id: SK-MATH-031
  tools:
    - Chaospy
    - OpenTURNS
    - UQpy
  processes:
    - uncertainty-quantification
    - stochastic-modeling
---

# Polynomial Chaos Expansion Skill

## Purpose

Provides polynomial chaos expansion methods for efficient uncertainty propagation in stochastic systems.

## Capabilities

- **Basis Selection**: Hermite, Legendre, custom polynomials
- **Projection Methods**: Galerkin, collocation
- **Sparse PCE**: Compressive sensing approaches
- **Adaptive Methods**: Adaptive basis selection
- **Multi-Element PCE**: Discontinuous responses
- **Sensitivity Indices**: Sobol indices from PCE

## Usage Guidelines

1. **Basis Construction**
   - Match basis to input distribution
   - Determine polynomial order
   - Consider tensor vs sparse

2. **Coefficient Computation**
   - Choose projection method
   - Select quadrature rules
   - Validate coefficient accuracy

3. **Post-Processing**
   - Extract statistical moments
   - Compute sensitivity indices
   - Generate probability distributions

4. **Best Practices**
   - Verify convergence with order
   - Check for Gibbs phenomena
   - Validate against MC sampling
