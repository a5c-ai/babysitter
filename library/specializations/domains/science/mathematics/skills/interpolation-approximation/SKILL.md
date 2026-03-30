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
metadata:
  specialization: mathematics
  domain: science
  category: numerical-analysis
  phase: 6
---

# Interpolation and Approximation

## Purpose

Provides function interpolation and approximation methods for data fitting and function representation.

## Capabilities

- Polynomial interpolation (Lagrange, Newton, Chebyshev)
- Spline interpolation (cubic, B-spline)
- Rational approximation (Pade)
- Least squares fitting
- Minimax approximation (Remez algorithm)
- Approximation error bounds

## Usage Guidelines

1. **Method Selection**: Choose based on smoothness and accuracy needs
2. **Node Placement**: Use Chebyshev nodes to minimize Runge phenomenon
3. **Spline Order**: Select spline degree based on continuity requirements
4. **Error Analysis**: Bound approximation errors rigorously

## Tools/Libraries

- Chebfun
- scipy.interpolate
