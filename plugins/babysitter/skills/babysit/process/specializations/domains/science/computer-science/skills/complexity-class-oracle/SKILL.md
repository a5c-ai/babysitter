---
name: complexity-class-oracle
description: Classify computational problems into complexity classes with supporting evidence and proof strategies
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
    - Complexity Zoo database
    - Diagram generation
    - Knowledge base
  processes:
    - computational-problem-classification
    - np-completeness-proof
    - decidability-analysis
---

# Complexity Class Oracle Skill

## Purpose

Provides complexity classification capabilities for determining membership of problems in complexity classes and identifying proof strategies.

## Capabilities

- **Class Membership**: Determine P, NP, co-NP, PSPACE, EXPTIME membership
- **Complete Problems**: Identify complete problems for each class
- **Database Query**: Query known complexity results
- **Proof Strategies**: Suggest strategies for classification proofs
- **Landscape Diagrams**: Generate complexity landscape visualizations

## Usage Guidelines

1. **Problem Analysis**
   - Formalize problem precisely
   - Identify decision vs. search versions
   - Note special cases and parameters

2. **Classification**
   - Check known results first
   - Identify similar classified problems
   - Determine upper and lower bounds

3. **Proof Strategy**
   - Select reduction source for hardness
   - Design polynomial algorithm for membership
   - Consider parameterized complexity

4. **Best Practices**
   - Document problem formalization
   - Reference known complexity results
   - Consider multiple complexity measures
   - Update with new research findings
