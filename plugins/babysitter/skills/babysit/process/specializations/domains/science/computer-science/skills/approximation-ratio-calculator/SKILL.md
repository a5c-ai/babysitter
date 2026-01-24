---
name: approximation-ratio-calculator
description: Analyze and prove approximation ratios for optimization algorithms
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
  category: complexity-theory
  domain: computer-science
  tools:
    - LP/ILP solvers
    - Symbolic computation
    - Mathematical analysis
  processes:
    - approximation-algorithm-design
    - algorithm-complexity-analysis
---

# Approximation Ratio Calculator Skill

## Purpose

Provides approximation analysis capabilities for determining and proving approximation ratios of algorithms for NP-hard optimization problems.

## Capabilities

- **LP Relaxation Analysis**: Analyze linear programming relaxations
- **Integrality Gap**: Compute integrality gap for LP-based algorithms
- **Randomized Rounding**: Analyze randomized rounding schemes
- **Factor Derivation**: Derive approximation factors formally
- **PTAS Assessment**: Assess PTAS/FPTAS feasibility

## Usage Guidelines

1. **Problem Setup**
   - Formalize optimization problem
   - Define approximation goal (minimize/maximize)
   - Identify optimal solution bound

2. **Analysis Method**
   - Design LP relaxation if applicable
   - Analyze algorithm output quality
   - Compare to optimal bound

3. **Ratio Proof**
   - Establish worst-case ratio
   - Consider tight examples
   - Verify analysis correctness

4. **Best Practices**
   - Prove both upper and lower bounds when possible
   - Document tight examples
   - Consider inapproximability results
   - Compare with known algorithms
