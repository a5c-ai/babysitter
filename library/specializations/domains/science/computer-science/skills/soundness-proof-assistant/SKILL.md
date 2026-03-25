---
name: soundness-proof-assistant
description: Assist in constructing type soundness proofs using progress and preservation theorems
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
  category: programming-language-theory
  phase: 6
---

# Soundness Proof Assistant

## Purpose

Provides expert guidance on constructing type soundness proofs for programming language type systems.

## Capabilities

- Progress theorem proof templates
- Preservation theorem proof templates
- Substitution lemma generation
- Canonical forms lemma derivation
- Proof case enumeration
- Mechanization guidance

## Usage Guidelines

1. **Lemma Identification**: Identify required supporting lemmas
2. **Progress Proof**: Prove progress theorem by cases
3. **Preservation Proof**: Prove preservation theorem
4. **Substitution Lemmas**: Prove substitution preserves typing
5. **Mechanization**: Translate to proof assistant

## Tools/Libraries

- Coq
- Agda
- Lean
- Twelf
