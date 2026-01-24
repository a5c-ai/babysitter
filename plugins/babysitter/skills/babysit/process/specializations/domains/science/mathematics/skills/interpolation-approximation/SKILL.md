---
name: interpolation-approximation
description: Function interpolation and approximation methods
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
  backlog-id: SK-MATH-015
  tools:
    - Chebfun
    - scipy.interpolate
  processes:
    - numerical-stability-analysis
    - model-validation-framework
---

# Interpolation and Approximation Skill

## Purpose

Provides function interpolation and approximation methods with error bound analysis.

## Capabilities

- **Polynomial Interpolation**: Lagrange, Newton, Chebyshev interpolation
- **Splines**: Cubic splines, B-splines
- **Rational Approximation**: Pade approximants
- **Least Squares**: Least squares fitting
- **Minimax**: Remez algorithm for best approximation
- **Error Bounds**: Approximation error analysis

## Usage Guidelines

1. **Method Selection**
   - Use Chebyshev points for polynomial interpolation
   - Use splines for smooth interpolation
   - Use Pade for rational approximation

2. **Implementation**
   - Avoid Runge phenomenon
   - Choose appropriate degree
   - Assess approximation quality

3. **Error Analysis**
   - Estimate interpolation error
   - Compare approximations
   - Validate against test functions

4. **Best Practices**
   - Use stable bases
   - Monitor condition numbers
   - Document approximation quality
