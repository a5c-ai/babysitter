---
name: theorem-prover-interface
description: Interface with interactive theorem provers including Coq, Isabelle, and Lean
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
    - Coq
    - Isabelle
    - Lean
  processes:
    - theorem-prover-verification
    - algorithm-correctness-proof
---

# Theorem Prover Interface Skill

## Purpose

Provides interface to interactive theorem provers for formal verification and mechanized proof construction.

## Capabilities

- **Coq Interface**: Generate and execute Coq proof scripts
- **Isabelle Interface**: Interface with Isabelle/HOL
- **Lean Integration**: Support Lean 4 proofs
- **Proof Automation**: Use hammers and tactics
- **Library Search**: Search proof libraries

## Usage Guidelines

1. **Prover Selection**
   - Use Coq for program extraction
   - Choose Isabelle for automation
   - Apply Lean for modern features

2. **Formalization**
   - Encode definitions precisely
   - State theorems clearly
   - Plan proof structure

3. **Proof Construction**
   - Apply appropriate tactics
   - Use automation when possible
   - Structure proofs for readability

4. **Best Practices**
   - Follow library conventions
   - Document proof strategies
   - Maintain proof modularity
   - Consider proof extraction
