---
name: sage-math-interface
description: SageMath for comprehensive mathematical computation with unified interface
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
  backlog-id: SK-MATH-009
  tools:
    - SageMath
    - GAP
    - Singular
    - PARI/GP
  processes:
    - symbolic-simplification
    - conjecture-exploration
    - algorithm-complexity-analysis
---

# SageMath Interface Skill

## Purpose

Provides interface to SageMath for comprehensive mathematical computation with unified access to multiple computer algebra systems.

## Capabilities

- **Unified Interface**: Access multiple CAS systems through one interface
- **Number Theory**: Comprehensive number-theoretic computations
- **Algebraic Geometry**: Algebraic geometry calculations
- **Combinatorics**: Combinatorics and graph theory
- **Cryptography**: Cryptographic functions
- **Notebooks**: Jupyter notebook integration

## Usage Guidelines

1. **System Access**
   - Use SageMath as unified frontend
   - Access GAP for group theory
   - Use Singular for polynomials

2. **Computation**
   - Leverage appropriate subsystem
   - Use Sage types appropriately
   - Combine systems as needed

3. **Notebook Workflow**
   - Use Jupyter for interactive work
   - Document computations inline
   - Share reproducible notebooks

4. **Best Practices**
   - Learn system-specific features
   - Use appropriate data types
   - Document computational approach
