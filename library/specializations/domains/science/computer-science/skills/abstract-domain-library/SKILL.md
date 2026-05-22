---
name: abstract-domain-library
description: Library of abstract domains for static analysis and abstract interpretation
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
  category: formal-verification
  phase: 6
graph:
  domains: [domain:computer-science]
  specializations: [specialization:theoretical-computer-science]
  skillAreas: [skill-area:compiler-implementation, skill-area:mathematical-reasoning, skill-area:language-design]
  workflows: [workflow:research-grant-lifecycle]
  roles: [role:computational-scientist, role:research-scientist]
---

# Abstract Domain Library

## Purpose

Provides expert guidance on abstract domains for abstract interpretation-based static analysis.

## Capabilities

- Interval domain
- Octagon domain
- Polyhedra domain
- Congruence domain
- Domain combination (reduced product)
- Widening and narrowing operators

## Usage Guidelines

1. **Domain Selection**: Choose appropriate abstract domain
2. **Operations**: Implement domain operations
3. **Widening**: Design widening for termination
4. **Precision Tuning**: Balance precision and efficiency
5. **Combination**: Combine domains for precision

## Tools/Libraries

- Apron
- ELINA
- Crab
- Frama-C
