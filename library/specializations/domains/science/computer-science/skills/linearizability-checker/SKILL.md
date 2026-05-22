---
name: linearizability-checker
description: Check linearizability of concurrent data structure implementations
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
  category: distributed-systems
  phase: 6
graph:
  domains: [domain:computer-science]
  specializations: [specialization:theoretical-computer-science]
  skillAreas: [skill-area:compiler-implementation, skill-area:mathematical-reasoning, skill-area:language-design]
  workflows: [workflow:research-grant-lifecycle]
  roles: [role:computational-scientist, role:research-scientist]
---

# Linearizability Checker

## Purpose

Provides expert guidance on verifying linearizability of concurrent data structures through testing and proof.

## Capabilities

- History linearization algorithms
- Linearization point identification
- Counterexample generation for violations
- Concurrent history visualization
- Linearizability proof templates
- Testing framework integration

## Usage Guidelines

1. **History Collection**: Record concurrent operation histories
2. **Linearization**: Check if history is linearizable
3. **Counterexample Analysis**: Analyze non-linearizable executions
4. **Proof Construction**: Build linearizability proofs
5. **Testing**: Systematic testing for violations

## Tools/Libraries

- LineUp
- Wing-Gong algorithm
- Lincheck
- JCStress
