---
name: coq-proof-assistant
description: Interface with Coq proof assistant for formal verification using SSReflect and MathComp
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
  category: theorem-proving
  domain: mathematics
  backlog-id: SK-MATH-002
  tools:
    - Coq
    - SSReflect
    - MathComp
  processes:
    - theorem-proof-verification
    - proof-writing-assistance
---

# Coq Proof Assistant Skill

## Purpose

Provides interface to Coq proof assistant for formal mathematical verification using SSReflect and Mathematical Components library.

## Capabilities

- **Tactic Generation**: Generate Ltac and Ltac2 tactics
- **SSReflect Integration**: Use SSReflect proof style
- **MathComp Library**: Access Mathematical Components library
- **Proof by Reflection**: Apply proof by reflection techniques
- **Code Extraction**: Extract to OCaml/Haskell
- **Documentation**: Generate proof documentation

## Usage Guidelines

1. **Project Setup**
   - Configure Coq project structure
   - Set up SSReflect/MathComp dependencies
   - Configure editor with proof general

2. **Proof Development**
   - Use SSReflect style for cleaner proofs
   - Leverage MathComp algebraic hierarchy
   - Apply automation appropriately

3. **Extraction**
   - Plan extraction targets
   - Handle extraction directives
   - Verify extracted code

4. **Best Practices**
   - Follow MathComp conventions
   - Use small-scale reflection
   - Document proof strategies
