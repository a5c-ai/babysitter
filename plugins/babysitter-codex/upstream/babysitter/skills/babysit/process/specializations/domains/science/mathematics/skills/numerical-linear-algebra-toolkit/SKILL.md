---
name: numerical-linear-algebra-toolkit
description: High-performance numerical linear algebra operations
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

# Numerical Linear Algebra Toolkit

## Purpose

Provides high-performance numerical linear algebra operations for scientific computing and mathematical analysis.

## Capabilities

- Matrix decompositions (LU, QR, SVD, Cholesky, Schur)
- Eigenvalue/eigenvector computation
- Sparse matrix operations
- Iterative solvers (CG, GMRES, BiCGSTAB)
- Condition number estimation
- Error analysis and bounds

## Usage Guidelines

1. **Decomposition Selection**: Choose appropriate factorization for the problem
2. **Sparsity Exploitation**: Use sparse formats for large sparse matrices
3. **Iterative Methods**: Apply iterative solvers for very large systems
4. **Conditioning**: Assess and monitor condition numbers

## Tools/Libraries

- LAPACK
- BLAS
- SuiteSparse
- Eigen
