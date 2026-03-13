---
name: optimization-correctness-verifier
description: Verify correctness of compiler optimizations using formal methods
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: computer-science
  domain: science
  category: compiler-optimization
  phase: 6
---

# Optimization Correctness Verifier

## Purpose

Provides expert guidance on verifying semantic preservation of compiler optimizations.

## Capabilities

- Semantic preservation checking
- Alive2-style verification
- Bisimulation proof construction
- Counterexample generation
- Optimization refinement suggestions
- Undefined behavior handling

## Usage Guidelines

1. **Optimization Specification**: Define source and target patterns
2. **Precondition Identification**: Identify required preconditions
3. **Verification**: Check semantic equivalence
4. **Counterexample Analysis**: Analyze any counterexamples
5. **Refinement**: Refine optimization if needed

## Tools/Libraries

- Alive2
- CompCert
- SMT solvers
- Vellvm
