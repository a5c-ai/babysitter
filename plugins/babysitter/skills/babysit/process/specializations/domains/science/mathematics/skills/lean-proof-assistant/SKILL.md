---
name: lean-proof-assistant
description: Interface with Lean 4 proof assistant for formal theorem verification using Mathlib4
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
  backlog-id: SK-MATH-001
  tools:
    - Lean 4
    - Mathlib4
    - Lake build system
  processes:
    - theorem-proof-verification
    - proof-writing-assistance
---

# Lean Proof Assistant Skill

## Purpose

Provides interface to Lean 4 proof assistant for formal verification of mathematical theorems using the Mathlib4 library.

## Capabilities

- **Proof Parsing**: Parse informal proofs into Lean 4 syntax
- **Tactic Generation**: Generate tactic-based proof scripts
- **Mathlib Access**: Access Mathlib4 library for standard results
- **Automated Rewriting**: Apply automated term rewriting and simplification
- **Proof Outlines**: Generate proof outlines with sorry placeholders
- **Code Extraction**: Extract executable code from proofs

## Usage Guidelines

1. **Setup**
   - Initialize Lean 4 project with Lake
   - Configure Mathlib4 dependencies
   - Set up editor integration

2. **Proof Development**
   - Start with sorry placeholders
   - Fill in proofs incrementally
   - Use automation judiciously

3. **Library Usage**
   - Search Mathlib for relevant lemmas
   - Follow Mathlib conventions
   - Contribute new results when appropriate

4. **Best Practices**
   - Keep proofs readable and maintainable
   - Document non-obvious steps
   - Use consistent naming conventions
