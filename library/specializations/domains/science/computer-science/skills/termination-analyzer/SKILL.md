---
name: termination-analyzer
description: Prove termination of algorithms and programs using ranking functions and well-founded orderings
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
  category: algorithm-analysis
  phase: 6
graph:
  domains: [domain:computer-science]
  specializations: [specialization:theoretical-computer-science]
  skillAreas: [skill-area:compiler-implementation, skill-area:mathematical-reasoning, skill-area:language-design]
  workflows: [workflow:research-grant-lifecycle]
  roles: [role:computational-scientist, role:research-scientist]
---

# Termination Analyzer

## Purpose

Provides expert guidance on proving termination of algorithms through ranking functions, well-founded orderings, and automated analysis.

## Capabilities

- Identify ranking/variant functions automatically
- Prove well-founded orderings
- Handle mutual recursion
- Detect potential non-termination
- Generate termination certificates
- Analyze complex control flow

## Usage Guidelines

1. **Structure Analysis**: Identify recursive calls and loop structures
2. **Ranking Function**: Find or construct appropriate ranking function
3. **Ordering Proof**: Prove well-foundedness of the ordering
4. **Certificate Generation**: Generate formal termination proof
5. **Non-termination Detection**: Flag potential infinite loops

## Tools/Libraries

- AProVE
- T2
- Ultimate Automizer
- SMT solvers
