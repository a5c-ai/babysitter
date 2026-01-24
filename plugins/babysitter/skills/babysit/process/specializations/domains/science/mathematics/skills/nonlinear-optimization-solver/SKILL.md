---
name: nonlinear-optimization-solver
description: Solve general nonlinear optimization problems
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
  backlog-id: SK-MATH-017
  tools:
    - IPOPT
    - KNITRO
    - NLopt
    - scipy.optimize
  processes:
    - optimization-problem-formulation
    - sensitivity-analysis-optimization
---

# Nonlinear Optimization Solver Skill

## Purpose

Provides solution methods for general nonlinear optimization problems including gradient-based and derivative-free approaches.

## Capabilities

- **Gradient Methods**: BFGS, L-BFGS, conjugate gradient
- **Newton Methods**: Newton and quasi-Newton methods
- **Interior Point**: Interior point methods for constrained problems
- **SQP**: Sequential quadratic programming
- **Global Optimization**: Basin-hopping, differential evolution
- **Constraint Handling**: Equality and inequality constraints

## Usage Guidelines

1. **Problem Analysis**
   - Assess smoothness and convexity
   - Identify local vs global optimization needs
   - Determine constraint structure

2. **Solver Selection**
   - Use gradient methods for smooth problems
   - Use derivative-free for noisy/expensive functions
   - Use global methods when needed

3. **Tuning**
   - Configure convergence tolerances
   - Set appropriate bounds
   - Use warm starting when possible

4. **Best Practices**
   - Provide gradients when available
   - Use multiple starting points
   - Verify solutions
