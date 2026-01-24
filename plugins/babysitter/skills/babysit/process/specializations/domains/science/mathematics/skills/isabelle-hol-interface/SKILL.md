---
name: isabelle-hol-interface
description: Interface with Isabelle/HOL for classical mathematics formalization
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
  backlog-id: SK-MATH-003
  tools:
    - Isabelle
    - Archive of Formal Proofs
  processes:
    - theorem-proof-verification
    - proof-writing-assistance
---

# Isabelle/HOL Interface Skill

## Purpose

Provides interface to Isabelle/HOL for formalization of classical mathematics and access to the Archive of Formal Proofs.

## Capabilities

- **Isar Proofs**: Generate Isar structured proofs
- **Sledgehammer**: Use Sledgehammer for automated theorem proving
- **AFP Access**: Access Archive of Formal Proofs
- **Locales/Classes**: Use locales and type classes
- **Code Generation**: Generate code to SML/Haskell
- **Document Generation**: Generate LaTeX documentation

## Usage Guidelines

1. **Theory Development**
   - Structure theories logically
   - Use locales for parameterization
   - Follow AFP conventions

2. **Proof Automation**
   - Apply Sledgehammer for hard goals
   - Use simp and auto appropriately
   - Configure proof methods

3. **Code Generation**
   - Set up code equations
   - Configure target language
   - Verify generated code

4. **Best Practices**
   - Write readable Isar proofs
   - Reuse AFP theories
   - Document assumptions clearly
