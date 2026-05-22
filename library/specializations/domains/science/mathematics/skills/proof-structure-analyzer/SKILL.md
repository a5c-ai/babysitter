---
name: proof-structure-analyzer
description: Analyze and restructure mathematical proofs for clarity and completeness
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

# Proof Structure Analyzer

## Purpose

Provides analysis and restructuring capabilities for mathematical proofs to improve clarity, completeness, and logical flow.

## Capabilities

- Proof strategy identification (induction, contradiction, etc.)
- Dependency graph construction
- Gap detection in reasoning chains
- Proof outline generation
- Lemma extraction suggestions

## Usage Guidelines

1. **Strategy Analysis**: Identify the overall proof approach
2. **Dependency Mapping**: Build logical dependency graphs
3. **Gap Detection**: Find missing steps or unjustified claims
4. **Restructuring**: Suggest clearer proof organization

## Tools/Libraries

- Natural language parsing
- Formal logic representation
- Graph analysis tools
