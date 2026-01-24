---
name: temporal-logic-translator
description: Translate between temporal logic formalisms including LTL, CTL, and natural language
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
    - Spot
    - GOAL
    - Temporal logic tools
  processes:
    - model-checking-verification
    - formal-specification-development
---

# Temporal Logic Translator Skill

## Purpose

Provides temporal logic translation capabilities for converting between different specification formalisms.

## Capabilities

- **LTL to Automata**: Translate LTL to Buchi automata
- **CTL Comparison**: Compare CTL and CTL* formulas
- **Natural Language**: Translate natural language to temporal logic
- **Property Patterns**: Apply specification pattern templates
- **Equivalence Checking**: Check formula equivalence

## Usage Guidelines

1. **Formula Specification**
   - Choose appropriate temporal logic
   - Express properties precisely
   - Verify syntax correctness

2. **Translation**
   - Translate to target formalism
   - Verify translation correctness
   - Optimize resulting formulas

3. **Pattern Application**
   - Use property pattern library
   - Instantiate patterns for specific needs
   - Combine patterns compositionally

4. **Best Practices**
   - Understand logic expressiveness
   - Verify translations carefully
   - Document property intuitions
   - Use patterns when applicable
