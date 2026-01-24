---
name: soundness-proof-assistant
description: Assist in constructing type soundness proofs including progress and preservation theorems
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
  category: programming-language-theory
  domain: computer-science
  tools:
    - Coq
    - Agda
    - Proof assistants
  processes:
    - type-system-design
    - operational-semantics-specification
---

# Soundness Proof Assistant Skill

## Purpose

Provides assistance for constructing type soundness proofs, including progress and preservation theorems for programming languages.

## Capabilities

- **Progress Templates**: Generate progress theorem proof templates
- **Preservation Templates**: Generate preservation theorem templates
- **Substitution Lemma**: Derive substitution lemma proofs
- **Canonical Forms**: Generate canonical forms lemma proofs
- **Case Enumeration**: Enumerate proof cases systematically

## Usage Guidelines

1. **Proof Setup**
   - Define type system and operational semantics
   - Identify auxiliary lemmas needed
   - Plan proof structure

2. **Progress Proof**
   - Prove well-typed terms are values or step
   - Handle all syntactic forms
   - Use canonical forms lemma

3. **Preservation Proof**
   - Prove typing preserved under reduction
   - Use substitution lemma
   - Handle all reduction rules

4. **Best Practices**
   - State lemmas precisely
   - Document proof dependencies
   - Verify with proof assistants
   - Consider mechanization from start
