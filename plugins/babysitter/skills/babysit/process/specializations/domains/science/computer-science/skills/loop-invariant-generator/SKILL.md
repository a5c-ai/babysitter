---
name: loop-invariant-generator
description: Automatically generate and verify loop invariants for algorithm correctness proofs
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
    - Static analysis
    - SMT solvers
    - Dafny
    - Why3
  processes:
    - algorithm-correctness-proof
    - abstract-interpretation-analysis
---

# Loop Invariant Generator Skill

## Purpose

Provides automated loop invariant inference and verification capabilities for constructing rigorous algorithm correctness proofs.

## Capabilities

- **Invariant Inference**: Infer candidate loop invariants from code structure
- **Condition Verification**: Verify initialization, maintenance, and termination
- **Proof Templates**: Generate formal proof templates for invariants
- **Complex Structures**: Handle nested loops and complex data structures
- **Prover Export**: Export to theorem provers (Dafny, Why3, Coq)

## Usage Guidelines

1. **Code Analysis**
   - Parse loop structure and variables
   - Identify loop bounds and modifications
   - Extract postcondition requirements

2. **Invariant Generation**
   - Generate candidate invariants automatically
   - Strengthen candidates as needed
   - Handle quantified invariants

3. **Verification**
   - Check initialization before loop entry
   - Verify maintenance across iterations
   - Confirm postcondition on termination

4. **Best Practices**
   - Start with simple invariants
   - Strengthen incrementally
   - Verify with SMT solvers
   - Document proof structure
