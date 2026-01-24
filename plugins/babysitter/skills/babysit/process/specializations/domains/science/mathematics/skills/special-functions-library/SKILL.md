---
name: special-functions-library
description: Comprehensive special functions evaluation and manipulation
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
  category: symbolic-computation
  domain: mathematics
  backlog-id: SK-MATH-010
  tools:
    - DLMF
    - mpmath
    - scipy.special
  processes:
    - symbolic-simplification
    - symbolic-integration-differentiation
    - pde-solver-selection
---

# Special Functions Library Skill

## Purpose

Provides comprehensive evaluation and manipulation of mathematical special functions with high precision.

## Capabilities

- **Bessel Functions**: Bessel, hypergeometric, elliptic functions
- **Orthogonal Polynomials**: Legendre, Chebyshev, Hermite, Laguerre
- **Gamma Functions**: Gamma, beta, zeta functions
- **Asymptotic Expansions**: Asymptotic series and approximations
- **Connection Formulas**: Identities and transformation formulas
- **Arbitrary Precision**: High-precision evaluation

## Usage Guidelines

1. **Function Selection**
   - Use standard definitions (DLMF)
   - Handle branch cuts correctly
   - Choose appropriate precision

2. **Evaluation**
   - Use mpmath for high precision
   - scipy.special for standard precision
   - Verify results across implementations

3. **Identities**
   - Apply connection formulas
   - Use asymptotic forms when appropriate
   - Document transformations

4. **Best Practices**
   - Reference DLMF for definitions
   - Test at special values
   - Handle singularities carefully
