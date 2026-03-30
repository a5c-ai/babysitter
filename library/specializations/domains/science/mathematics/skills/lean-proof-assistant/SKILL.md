---
name: lean-proof-assistant
description: Interface with Lean 4 proof assistant for formal theorem verification
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

# Lean Proof Assistant

## Purpose

Provides expert guidance on using the Lean 4 proof assistant for formal theorem verification and mathematical formalization.

## Capabilities

- Parse informal proofs into Lean 4 syntax
- Generate tactic-based proof scripts
- Access Mathlib4 library for standard results
- Automated term rewriting and simplification
- Generate proof outlines with sorry placeholders
- Extract executable code from proofs

## Usage Guidelines

1. **Proof Development**: Use Lean 4 syntax with Mathlib4 conventions
2. **Tactic Application**: Apply tactics systematically (intro, apply, exact, rw)
3. **Library Navigation**: Search Mathlib4 for existing lemmas and theorems
4. **Proof Completion**: Fill sorry placeholders incrementally

## Tools/Libraries

- Lean 4
- Mathlib4
- Lake build system
- VS Code Lean extension
