---
name: asymptotic-notation-calculator
description: Automated derivation and simplification of Big-O, Big-Omega, and Big-Theta expressions for algorithm analysis
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
    - Symbolic computation
    - Mathematical notation rendering
    - LaTeX
  processes:
    - algorithm-complexity-analysis
    - algorithm-correctness-proof
    - complexity-lower-bound-proof
---

# Asymptotic Notation Calculator Skill

## Purpose

Provides automated derivation and simplification of asymptotic complexity expressions, enabling rigorous algorithm analysis with proper mathematical notation.

## Capabilities

- **Expression Parsing**: Parse and interpret asymptotic expressions
- **Simplification**: Simplify complex expressions to standard forms
- **Comparison**: Compare complexity classes formally
- **Dominant Terms**: Identify dominant terms in multi-term expressions
- **Factor Handling**: Handle logarithmic, polynomial, and exponential factors
- **LaTeX Generation**: Generate publication-quality LaTeX notation

## Usage Guidelines

1. **Expression Input**
   - Accept complexity expressions in various formats
   - Handle nested expressions and compositions
   - Support symbolic and numeric coefficients

2. **Analysis**
   - Apply asymptotic rules correctly
   - Identify tight bounds when possible
   - Distinguish O, Omega, and Theta

3. **Output**
   - Generate simplified standard forms
   - Provide step-by-step derivations
   - Export to LaTeX for publications

4. **Best Practices**
   - Verify simplifications are valid
   - Document assumptions about inputs
   - Consider special cases explicitly
   - Maintain mathematical rigor
