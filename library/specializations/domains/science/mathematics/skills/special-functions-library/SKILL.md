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
metadata:
  specialization: mathematics
  domain: science
  category: symbolic-computation
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-engineer, role:computational-scientist]
---

# Special Functions Library

## Purpose

Provides comprehensive capabilities for special functions evaluation, manipulation, and analysis.

## Capabilities

- Bessel, hypergeometric, elliptic functions
- Orthogonal polynomials (Legendre, Chebyshev, Hermite)
- Gamma, beta, zeta functions
- Asymptotic expansions
- Connection formulas and identities

## Usage Guidelines

1. **Function Selection**: Choose appropriate function definitions
2. **Numerical Evaluation**: Use high-precision arithmetic when needed
3. **Identities**: Apply transformation and connection formulas
4. **Asymptotics**: Use asymptotic expansions for large arguments

## Tools/Libraries

- DLMF (Digital Library of Mathematical Functions)
- mpmath
- scipy.special
