---
name: coq-proof-assistant
description: Interface with Coq proof assistant for formal verification
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: theorem-proving
  phase: 6
---

# Coq Proof Assistant

## Purpose

Provides expert guidance on using the Coq proof assistant for formal verification and mathematical formalization.

## Capabilities

- Ltac and Ltac2 tactic generation
- SSReflect/MathComp library integration
- Proof by reflection techniques
- Extraction to OCaml/Haskell
- Proof documentation generation

## Usage Guidelines

1. **Proof Scripts**: Write Coq vernacular with proper structuring
2. **Tactics**: Use Ltac macros for proof automation
3. **Libraries**: Leverage MathComp for algebra and SSReflect for reasoning
4. **Extraction**: Generate verified executable code

## Tools/Libraries

- Coq
- SSReflect
- MathComp
- CoqIDE or VS Code
