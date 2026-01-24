---
name: type-inference-engine
description: Implement and test type inference algorithms including Algorithm W and constraint-based inference
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
  category: programming-language-theory
  domain: computer-science
  tools:
    - Language workbenches
    - Constraint solvers
    - Unification algorithms
  processes:
    - type-system-design
    - dsl-design-implementation
---

# Type Inference Engine Skill

## Purpose

Provides type inference algorithm implementation capabilities for programming language design, including Hindley-Milner type inference.

## Capabilities

- **Algorithm W**: Implement classic Algorithm W for type inference
- **Constraint Generation**: Generate type constraints from terms
- **Unification**: Perform unification with occurs check
- **Let-Polymorphism**: Support Hindley-Milner let-polymorphism
- **Principal Types**: Compute most general (principal) types

## Usage Guidelines

1. **Algorithm Selection**
   - Choose Algorithm W for efficiency
   - Use constraint-based for extensions
   - Consider bidirectional for dependent types

2. **Constraint Generation**
   - Traverse abstract syntax tree
   - Generate equality constraints
   - Handle type annotations

3. **Unification**
   - Implement efficient union-find
   - Check occurs to prevent infinite types
   - Return most general unifier

4. **Best Practices**
   - Generate informative error messages
   - Support type annotations for documentation
   - Test on challenging examples
   - Document algorithm variants
