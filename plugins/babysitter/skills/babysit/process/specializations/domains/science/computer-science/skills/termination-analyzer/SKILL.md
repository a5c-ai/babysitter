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
  - Task
metadata:
  version: "1.0"
  category: algorithm-analysis
  domain: computer-science
  tools:
    - AProVE
    - T2
    - Termination provers
  processes:
    - algorithm-correctness-proof
    - decidability-analysis
---

# Termination Analyzer Skill

## Purpose

Provides termination analysis capabilities for proving that algorithms and programs always terminate using ranking functions and well-founded orderings.

## Capabilities

- **Ranking Functions**: Identify ranking/variant functions automatically
- **Well-Founded Orderings**: Prove well-foundedness of orderings
- **Mutual Recursion**: Handle mutually recursive function termination
- **Non-Termination Detection**: Detect potential non-termination
- **Certificates**: Generate machine-checkable termination certificates

## Usage Guidelines

1. **Analysis Setup**
   - Parse program or algorithm structure
   - Identify recursive calls and loops
   - Extract transition relations

2. **Ranking Function Search**
   - Try linear ranking functions first
   - Consider lexicographic orderings
   - Use template-based synthesis

3. **Proof Construction**
   - Verify ranking function decreases
   - Confirm well-foundedness
   - Handle conditional transitions

4. **Best Practices**
   - Start with simple ranking functions
   - Document well-foundedness arguments
   - Consider non-termination explicitly
   - Verify proofs with automated tools
