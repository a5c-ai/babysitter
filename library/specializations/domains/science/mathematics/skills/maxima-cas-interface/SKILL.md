---
name: maxima-cas-interface
description: Open-source computer algebra system for symbolic computation
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
  skillAreas: [skill-area:mathematical-reasoning, skill-area:computational-geometry, skill-area:graph-algorithms]
  workflows: [workflow:experiment-design]
  roles: [role:computational-scientist, role:research-scientist]
---

# Maxima CAS Interface

## Purpose

Provides interface with Maxima, an open-source computer algebra system for symbolic computation.

## Capabilities

- Symbolic manipulation and simplification
- Calculus operations (differentiation, integration)
- Tensor and differential geometry
- Polynomial factorization
- Laplace/Fourier transforms

## Usage Guidelines

1. **Command Syntax**: Use Maxima command conventions
2. **Simplification**: Apply ratsimp, radcan, trigsimp as appropriate
3. **Calculus**: Use diff, integrate, limit functions
4. **Output Formatting**: Control display with display options

## Tools/Libraries

- Maxima
- wxMaxima
