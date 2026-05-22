---
name: mathscinet-interface
description: Interface with MathSciNet for mathematical reviews
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - WebSearch
metadata:
  specialization: mathematics
  domain: science
  category: research
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:statistical-analysis, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:computational-scientist]
---

# MathSciNet Interface

## Purpose

Provides interface with MathSciNet for accessing mathematical reviews and bibliographic data.

## Capabilities

- MSC classification lookup
- Author profile retrieval
- Citation searching
- Review text access
- Related work discovery
- Collaboration network analysis

## Usage Guidelines

1. **MSC Codes**: Use Mathematics Subject Classification codes
2. **Author Search**: Search by author with disambiguation
3. **Citation Network**: Analyze citing and cited papers
4. **Reviews**: Access expert mathematical reviews

## Tools/Libraries

- MathSciNet API
