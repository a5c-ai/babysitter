---
name: probabilistic-analysis-toolkit
description: Analyze randomized algorithms using probability theory tools and concentration inequalities
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
    - Symbolic probability
    - Statistical libraries
    - Mathematical computation
  processes:
    - randomized-algorithm-analysis
    - approximation-algorithm-design
---

# Probabilistic Analysis Toolkit Skill

## Purpose

Provides probabilistic analysis capabilities for analyzing randomized algorithms using expected value calculations and concentration inequalities.

## Capabilities

- **Expected Value**: Calculate expected values of random variables
- **Chernoff Bounds**: Apply Chernoff and Hoeffding bounds
- **Moment Analysis**: Use Markov and Chebyshev inequalities
- **MGF Analysis**: Apply moment generating function techniques
- **Inequality Selection**: Select appropriate concentration inequalities

## Usage Guidelines

1. **Random Variable Setup**
   - Identify random variables in algorithm
   - Determine distributions
   - Check independence conditions

2. **Expectation Analysis**
   - Calculate expected running time
   - Compute expected solution quality
   - Use linearity of expectation

3. **Concentration Bounds**
   - Select appropriate concentration inequality
   - Apply bounds to derive high-probability results
   - Handle dependencies when present

4. **Best Practices**
   - Verify independence assumptions
   - Choose tightest applicable bounds
   - Document probability calculations
   - Consider derandomization potential
