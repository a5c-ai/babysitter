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
metadata:
  specialization: mathematics
  domain: science
  category: theorem-proving
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:compiler-implementation, skill-area:language-design]
  workflows: [workflow:experiment-design]
  roles: [role:computational-scientist, role:research-scientist]
---

# Isabelle/HOL Interface

## Purpose

Provides expert guidance on using Isabelle/HOL for classical mathematics formalization and theorem proving.

## Capabilities

- Isar structured proof generation
- Sledgehammer automated theorem proving
- Archive of Formal Proofs access
- Locales and type classes
- Code generation to SML/Haskell

## Usage Guidelines

1. **Isar Proofs**: Write structured proofs with have/show/proof
2. **Automation**: Use Sledgehammer for ATP assistance
3. **Libraries**: Access AFP for reusable formalizations
4. **Abstraction**: Use locales for modular theories

## Tools/Libraries

- Isabelle
- Archive of Formal Proofs (AFP)
- Sledgehammer ATPs
- Isabelle/jEdit
