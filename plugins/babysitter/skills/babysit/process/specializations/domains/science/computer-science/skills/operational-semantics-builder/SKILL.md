---
name: operational-semantics-builder
description: Define and test operational semantics specifications for programming languages
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
    - PLT Redex
    - K Framework
    - Semantics tools
  processes:
    - operational-semantics-specification
    - type-system-design
---

# Operational Semantics Builder Skill

## Purpose

Provides operational semantics specification capabilities for defining precise language behavior through small-step and big-step semantics.

## Capabilities

- **Small-Step Semantics**: Generate structural operational semantics rules
- **Big-Step Semantics**: Generate natural semantics rules
- **Evaluation Contexts**: Define evaluation context grammars
- **Binding Handling**: Handle variable binding and substitution
- **Semantics Testing**: Execute and test semantics definitions

## Usage Guidelines

1. **Semantics Design**
   - Choose small-step vs. big-step
   - Define value forms
   - Specify reduction relation

2. **Rule Generation**
   - Generate rules for each construct
   - Handle variable binding carefully
   - Define congruence rules

3. **Testing**
   - Execute semantics on examples
   - Verify expected results
   - Check determinism when expected

4. **Best Practices**
   - Keep rules compositional
   - Document evaluation order
   - Test edge cases
   - Export to executable format
