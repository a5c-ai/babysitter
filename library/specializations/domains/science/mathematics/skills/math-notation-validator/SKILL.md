---
name: math-notation-validator
description: Validate and standardize mathematical notation
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
  category: documentation
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:statistical-analysis, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:computational-scientist]
---

# Math Notation Validator

## Purpose

Provides validation and standardization capabilities for mathematical notation to ensure consistency and clarity.

## Capabilities

- Notation consistency checking
- Symbol definition tracking
- Notation conflict detection
- Style guide compliance
- Glossary generation
- Notation conversion between standards

## Usage Guidelines

1. **Symbol Tracking**: Maintain symbol definitions
2. **Consistency**: Check notation usage throughout document
3. **Style Compliance**: Follow journal/conference style guides
4. **Glossary**: Generate notation glossary for readers

## Tools/Libraries

- Custom parsers
- LaTeX linters
