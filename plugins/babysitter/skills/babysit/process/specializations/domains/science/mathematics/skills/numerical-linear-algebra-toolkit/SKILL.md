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
  - Task
metadata:
  version: "1.0"
  category: numerical-analysis
  domain: mathematics
  backlog-id: SK-MATH-011
  tools:
    - LAPACK
    - BLAS
    - SuiteSparse
    - Eigen
  processes:
    - matrix-computation-optimization
    - numerical-stability-analysis
---

# Numerical Linear Algebra Toolkit Skill

## Purpose

Provides high-performance numerical linear algebra operations with careful attention to accuracy and stability.

## Capabilities

- **Matrix Decompositions**: LU, QR, SVD, Cholesky, Schur decompositions
- **Eigenvalue Problems**: Eigenvalue and eigenvector computation
- **Sparse Operations**: Sparse matrix operations and solvers
- **Iterative Methods**: CG, GMRES, BiCGSTAB iterative solvers
- **Conditioning**: Condition number estimation
- **Error Analysis**: Error bounds and analysis

## Usage Guidelines

1. **Decomposition Selection**
   - Choose appropriate decomposition for task
   - Consider matrix structure (symmetric, sparse, etc.)
   - Assess conditioning before solving

2. **Solver Selection**
   - Use direct methods for small/medium problems
   - Use iterative methods for large sparse systems
   - Configure preconditioners appropriately

3. **Error Analysis**
   - Estimate condition numbers
   - Track error propagation
   - Validate results

4. **Best Practices**
   - Exploit matrix structure
   - Test on well-conditioned problems first
   - Document numerical precision
