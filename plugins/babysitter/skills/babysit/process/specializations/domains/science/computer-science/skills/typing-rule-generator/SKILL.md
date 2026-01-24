---
name: typing-rule-generator
description: Generate and format typing rules in inference rule notation for programming language design
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
    - LaTeX
    - Ott specification language
    - LNGen
  processes:
    - type-system-design
    - operational-semantics-specification
---

# Typing Rule Generator Skill

## Purpose

Provides typing rule generation capabilities for creating publication-quality inference rule notation in programming language research.

## Capabilities

- **LaTeX Generation**: Generate LaTeX inference rule notation
- **Syntax-Directed Rules**: Derive rules from language syntax
- **Derivation Trees**: Construct typing derivation trees
- **Dependency Analysis**: Analyze rule dependencies
- **Ott Export**: Export to Ott/LNGen format for mechanization

## Usage Guidelines

1. **Rule Design**
   - Define typing judgment structure
   - Identify contexts and environments
   - Specify subtyping if present

2. **Rule Generation**
   - Generate rules for each syntactic form
   - Handle variable binding correctly
   - Include well-formedness conditions

3. **Formatting**
   - Generate publication-quality LaTeX
   - Ensure consistent notation
   - Include rule names and labels

4. **Best Practices**
   - Follow established notation conventions
   - Document rule intuitions
   - Verify rule coverage of syntax
   - Export to proof assistant format
