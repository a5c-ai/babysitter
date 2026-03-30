---
name: floating-point-analysis
description: Rigorous floating-point error analysis
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

# Floating-Point Analysis

## Purpose

Provides rigorous floating-point error analysis capabilities for numerical algorithm verification and accuracy assessment.

## Capabilities

- IEEE 754 arithmetic modeling
- Roundoff error accumulation tracking
- Interval arithmetic computation
- Arbitrary precision arithmetic
- Numerical condition number computation
- Error bound derivation

## Usage Guidelines

1. **Error Modeling**: Model floating-point operations precisely
2. **Interval Arithmetic**: Use interval bounds for guaranteed accuracy
3. **High Precision**: Employ arbitrary precision for validation
4. **Error Bounds**: Derive forward and backward error bounds

## Tools/Libraries

- MPFR
- Arb
- Herbie
- FPBench
