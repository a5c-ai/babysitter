---
name: floating-point-analysis
description: Rigorous floating-point error analysis for numerical computations
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
  backlog-id: SK-MATH-014
  tools:
    - MPFR
    - Arb
    - Herbie
    - FPBench
  processes:
    - numerical-stability-analysis
    - benchmark-validation
---

# Floating-Point Analysis Skill

## Purpose

Provides rigorous floating-point error analysis for understanding and controlling numerical errors in computations.

## Capabilities

- **IEEE 754 Modeling**: Model IEEE 754 arithmetic behavior
- **Roundoff Tracking**: Track roundoff error accumulation
- **Interval Arithmetic**: Rigorous interval computations
- **Arbitrary Precision**: Use arbitrary precision when needed
- **Condition Numbers**: Compute numerical condition numbers
- **Error Bounds**: Derive error bounds

## Usage Guidelines

1. **Error Analysis**
   - Understand IEEE 754 representation
   - Track error propagation
   - Identify ill-conditioned steps

2. **Verification**
   - Use interval arithmetic for bounds
   - Compare with higher precision
   - Test at boundary cases

3. **Improvement**
   - Reformulate ill-conditioned expressions
   - Use compensated summation
   - Apply appropriate precision

4. **Best Practices**
   - Know your precision limits
   - Test with pathological inputs
   - Document numerical assumptions
