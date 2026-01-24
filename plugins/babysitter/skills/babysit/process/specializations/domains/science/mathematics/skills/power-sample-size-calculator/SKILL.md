---
name: power-sample-size-calculator
description: Statistical power analysis and sample size determination
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
  backlog-id: SK-MATH-024
  tools:
    - G*Power
    - pwr (R)
    - statsmodels
  processes:
    - experimental-design-planning
    - hypothesis-testing-framework
---

# Power and Sample Size Calculator Skill

## Purpose

Provides statistical power analysis and sample size determination for rigorous experimental design.

## Capabilities

- **Power Analysis**: Power analysis for common tests
- **Effect Sizes**: Effect size calculation
- **Sample Size**: Sample size estimation
- **Simulation-Based**: Simulation-based power analysis
- **Multilevel Power**: Power for multilevel models
- **Sequential Design**: Sequential analysis planning

## Usage Guidelines

1. **A Priori Analysis**
   - Specify effect size
   - Set significance level
   - Determine required power

2. **Post Hoc Analysis**
   - Calculate achieved power
   - Report with caveats
   - Consider alternatives

3. **Complex Designs**
   - Use simulation for complex cases
   - Account for clustering
   - Consider multiple comparisons

4. **Best Practices**
   - Use realistic effect sizes
   - Document assumptions
   - Plan for attrition
