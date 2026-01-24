---
name: combinatorial-enumeration
description: Combinatorial counting and enumeration
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
  category: discrete-mathematics
  domain: mathematics
  backlog-id: SK-MATH-028
  tools:
    - SymPy
    - Mathematica
    - OEIS API
  processes:
    - combinatorial-analysis
    - generating-function-methods
---

# Combinatorial Enumeration Skill

## Purpose

Provides tools for combinatorial counting, enumeration, and analysis of discrete structures.

## Capabilities

- **Counting Functions**: Permutations, combinations, partitions
- **Generating Functions**: OGF, EGF, Dirichlet series
- **Recurrence Relations**: Solve and analyze recurrences
- **Asymptotic Analysis**: Growth rate estimation
- **Bijective Proofs**: Construct bijections
- **OEIS Integration**: Sequence lookup and analysis

## Usage Guidelines

1. **Problem Formulation**
   - Identify structure to count
   - Determine symmetries
   - Choose counting approach

2. **Technique Selection**
   - Direct counting vs generating functions
   - Inclusion-exclusion when appropriate
   - Polya enumeration for symmetries

3. **Verification**
   - Check small cases manually
   - Verify against OEIS
   - Test boundary conditions

4. **Best Practices**
   - Document counting arguments
   - Provide bijective interpretations
   - Analyze asymptotics
