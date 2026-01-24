---
name: multiple-testing-correction
description: Multiple comparison correction methods
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
  category: statistical-computing
  domain: mathematics
  backlog-id: SK-MATH-025
  tools:
    - statsmodels
    - scipy.stats
    - multcomp (R)
  processes:
    - hypothesis-testing-framework
    - experimental-design-planning
---

# Multiple Testing Correction Skill

## Purpose

Provides multiple comparison correction methods for controlling family-wise error rate and false discovery rate.

## Capabilities

- **Bonferroni**: Bonferroni correction
- **Holm-Bonferroni**: Step-down Holm procedure
- **Benjamini-Hochberg**: FDR control
- **Sidak**: Sidak correction
- **Permutation-Based**: Permutation-based corrections
- **FWER Control**: Family-wise error rate methods

## Usage Guidelines

1. **Method Selection**
   - Use FWER for strong control
   - Use FDR for exploratory analysis
   - Consider dependency structure

2. **Application**
   - Define family of tests
   - Apply correction consistently
   - Report corrected p-values

3. **Interpretation**
   - Understand correction strength
   - Consider power tradeoffs
   - Report appropriately

4. **Best Practices**
   - Pre-specify correction method
   - Consider test dependency
   - Document multiple testing strategy
