---
name: sensitivity-analysis-toolkit
description: Comprehensive sensitivity analysis for optimization problems
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
  backlog-id: SK-MATH-019
  tools:
    - Pyomo
    - JuMP
    - AMPL
  processes:
    - sensitivity-analysis-optimization
    - optimization-problem-formulation
---

# Sensitivity Analysis Toolkit Skill

## Purpose

Provides comprehensive sensitivity analysis for optimization problems including dual analysis and parametric programming.

## Capabilities

- **Dual Variables**: Compute and interpret dual variables
- **Shadow Prices**: Analyze shadow prices
- **Parametric Programming**: Perform parametric analysis
- **Binding Constraints**: Analyze binding constraint structure
- **Post-Optimality**: Conduct post-optimality analysis
- **Robust Formulations**: Develop robust optimization formulations

## Usage Guidelines

1. **Dual Analysis**
   - Extract dual variables
   - Interpret economic meaning
   - Identify binding constraints

2. **Parametric Analysis**
   - Vary parameters systematically
   - Track solution changes
   - Identify critical parameter values

3. **Robustness**
   - Identify sensitive parameters
   - Formulate robust alternatives
   - Quantify solution stability

4. **Best Practices**
   - Verify dual feasibility
   - Document sensitivity ranges
   - Consider multiple scenarios
