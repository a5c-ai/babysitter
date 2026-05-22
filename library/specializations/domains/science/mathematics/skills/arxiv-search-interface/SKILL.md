---
name: arxiv-search-interface
description: Search and analyze mathematical literature on arXiv
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

# arXiv Search Interface

## Purpose

Provides search and analysis capabilities for mathematical literature on arXiv.

## Capabilities

- arXiv API queries
- Mathematical subject classification filtering
- Citation network analysis
- Abstract summarization
- Related paper recommendations
- Version tracking

## Usage Guidelines

1. **Query Formulation**: Use appropriate math.XX categories
2. **Filtering**: Apply date and author filters
3. **Citation Analysis**: Build citation networks
4. **Version Tracking**: Check for updated versions

## Tools/Libraries

- arXiv API
- Semantic Scholar
