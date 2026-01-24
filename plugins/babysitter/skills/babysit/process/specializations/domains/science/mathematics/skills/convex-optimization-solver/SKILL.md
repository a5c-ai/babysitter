---
name: convex-optimization-solver
description: Solve convex optimization problems efficiently using modern solvers
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
  category: optimization
  domain: mathematics
  backlog-id: SK-MATH-016
  tools:
    - CVXPY
    - Gurobi
    - MOSEK
    - SCS
    - ECOS
  processes:
    - optimization-problem-formulation
    - convex-analysis-verification
---

# Convex Optimization Solver Skill

## Purpose

Provides efficient solution of convex optimization problems including LP, QP, SOCP, and SDP.

## Capabilities

- **Linear Programming**: Solve LP problems
- **Quadratic Programming**: Solve QP problems
- **Cone Programs**: SOCP and SDP solving
- **Conic Optimization**: General conic programming
- **Duality Analysis**: Analyze dual problems
- **Infeasibility Detection**: Detect and diagnose infeasibility

## Usage Guidelines

1. **Problem Formulation**
   - Verify convexity
   - Choose appropriate cone
   - Model constraints correctly

2. **Solver Selection**
   - Use interior point for medium problems
   - Use first-order for large problems
   - Configure tolerances appropriately

3. **Solution Analysis**
   - Extract primal and dual solutions
   - Check optimality conditions
   - Analyze sensitivity

4. **Best Practices**
   - Verify problem is convex
   - Scale problem appropriately
   - Use disciplined convex programming
