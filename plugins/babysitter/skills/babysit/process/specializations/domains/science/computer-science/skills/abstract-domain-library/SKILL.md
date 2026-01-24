---
name: abstract-domain-library
description: Library of abstract domains for static analysis including intervals, octagons, and polyhedra
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
    - Apron
    - ELINA
    - Abstract interpretation tools
  processes:
    - abstract-interpretation-analysis
---

# Abstract Domain Library Skill

## Purpose

Provides abstract domain implementations for static analysis based on abstract interpretation theory.

## Capabilities

- **Interval Domain**: Implement interval abstract domain
- **Octagon Domain**: Implement octagon constraints
- **Polyhedra Domain**: Implement convex polyhedra
- **Congruence Domain**: Implement congruence relations
- **Domain Combination**: Combine domains with reduced product

## Usage Guidelines

1. **Domain Selection**
   - Use intervals for simple bounds
   - Use octagons for relational analysis
   - Use polyhedra for precision

2. **Analysis Configuration**
   - Configure widening thresholds
   - Set narrowing iterations
   - Balance precision vs. cost

3. **Domain Operations**
   - Implement join and meet
   - Apply widening correctly
   - Use narrowing for precision

4. **Best Practices**
   - Understand domain expressiveness
   - Document precision limitations
   - Test on representative programs
   - Consider domain products
