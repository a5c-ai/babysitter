---
name: smt-solver-interface
description: Interface with SMT solvers for verification, synthesis, and constraint solving
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
  category: formal-verification
  domain: computer-science
  tools:
    - Z3
    - CVC5
    - Boolector
  processes:
    - model-checking-verification
    - abstract-interpretation-analysis
    - program-synthesis-specification
---

# SMT Solver Interface Skill

## Purpose

Provides SMT solver interface capabilities for automated verification, synthesis, and constraint solving.

## Capabilities

- **Z3 Interface**: Generate and solve Z3 queries
- **CVC5 Interface**: Interface with CVC5 solver
- **Theory Selection**: Guide appropriate theory selection
- **Model Extraction**: Extract satisfying models
- **Unsat Core Analysis**: Analyze unsatisfiable cores

## Usage Guidelines

1. **Problem Encoding**
   - Choose appropriate SMT theories
   - Encode constraints precisely
   - Configure solver options

2. **Solving**
   - Submit query to solver
   - Handle sat/unsat/unknown results
   - Extract models or cores

3. **Result Interpretation**
   - Interpret satisfying models
   - Analyze unsat cores
   - Refine encoding if needed

4. **Best Practices**
   - Use appropriate theories
   - Simplify constraints when possible
   - Handle timeouts gracefully
   - Document solver configurations
