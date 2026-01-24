---
name: sympy-computer-algebra
description: Symbolic computation using SymPy for Python-based mathematical analysis
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
  backlog-id: SK-MATH-006
  tools:
    - SymPy
    - NumPy
    - mpmath
  processes:
    - symbolic-simplification
    - symbolic-integration-differentiation
---

# SymPy Computer Algebra Skill

## Purpose

Provides comprehensive symbolic computation capabilities using SymPy for algebraic manipulation, calculus, and equation solving.

## Capabilities

- **Differentiation/Integration**: Symbolic differentiation and integration
- **Equation Solving**: Solve algebraic and differential equations
- **Series Expansion**: Taylor series and limits
- **Matrix Algebra**: Symbolic matrix operations
- **Simplification**: Pattern matching and simplification
- **Code Generation**: Generate NumPy, C, Fortran code

## Usage Guidelines

1. **Expression Creation**
   - Define symbols with appropriate assumptions
   - Build expressions systematically
   - Use appropriate simplification

2. **Computation**
   - Apply differentiation and integration
   - Solve equations symbolically
   - Expand and simplify as needed

3. **Output**
   - Export to LaTeX
   - Generate numerical code
   - Verify results numerically

4. **Best Practices**
   - Set symbol assumptions correctly
   - Verify symbolic results numerically
   - Use appropriate precision
