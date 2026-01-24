---
name: recurrence-solver
description: Solve recurrence relations using Master Theorem, substitution method, recursion trees, and generating functions
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
  category: algorithm-analysis
  domain: computer-science
  tools:
    - Symbolic algebra system
    - Visualization tools
    - Mathematical solvers
  processes:
    - algorithm-complexity-analysis
    - randomized-algorithm-analysis
---

# Recurrence Solver Skill

## Purpose

Provides comprehensive recurrence relation solving capabilities using multiple methods to determine algorithmic time complexities from recursive definitions.

## Capabilities

- **Master Theorem**: Apply all three cases of the Master Theorem
- **Substitution Method**: Verify guessed solutions with induction
- **Recursion Trees**: Visualize and analyze recursive call structure
- **Generating Functions**: Solve complex recurrences analytically
- **Akra-Bazzi Method**: Handle generalized divide-and-conquer recurrences

## Usage Guidelines

1. **Recurrence Identification**
   - Extract recurrence from algorithm structure
   - Identify base cases and recursive cases
   - Normalize to standard forms

2. **Method Selection**
   - Try Master Theorem for standard forms
   - Use recursion trees for intuition
   - Apply Akra-Bazzi for non-standard cases

3. **Solution Verification**
   - Verify solutions via substitution
   - Check base case satisfaction
   - Confirm inductive step

4. **Best Practices**
   - Document method selection rationale
   - Visualize recursion trees when helpful
   - Verify tight bounds when possible
   - Consider average vs. worst case
