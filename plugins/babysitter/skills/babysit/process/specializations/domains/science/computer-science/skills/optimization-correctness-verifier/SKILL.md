---
name: optimization-correctness-verifier
description: Verify correctness of compiler optimizations using semantic preservation checking
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
  category: compiler-optimization
  domain: computer-science
  tools:
    - Alive2
    - CompCert
    - SMT solvers
  processes:
    - compiler-optimization-design
---

# Optimization Correctness Verifier Skill

## Purpose

Provides compiler optimization verification capabilities for proving that transformations preserve program semantics.

## Capabilities

- **Semantic Preservation**: Check optimization preserves semantics
- **Alive2 Verification**: Use Alive2-style verification
- **Bisimulation Proofs**: Construct bisimulation arguments
- **Counterexamples**: Generate counterexamples for bugs
- **Refinement Suggestions**: Suggest optimization refinements

## Usage Guidelines

1. **Verification Setup**
   - Specify source and target patterns
   - Define preconditions
   - Identify undefined behavior

2. **Verification Execution**
   - Check refinement relation
   - Find counterexamples if any
   - Report verification result

3. **Bug Analysis**
   - Analyze counterexamples
   - Identify missing preconditions
   - Suggest corrections

4. **Best Practices**
   - Verify all optimization patterns
   - Handle undefined behavior carefully
   - Document verification status
   - Maintain verified optimization database
