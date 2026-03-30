---
name: pubmed-literature-miner
description: Biomedical literature mining using PubMed/MEDLINE for systematic review support
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
metadata:
  specialization: scientific-discovery
  domain: science
  category: literature-knowledge
  phase: 6
---

# PubMed Literature Miner

## Purpose

Provides biomedical literature mining capabilities using PubMed/MEDLINE for systematic review support and PICO framework analysis.

## Capabilities

- MeSH term-based search
- PICO element extraction
- Abstract screening automation
- Citation deduplication
- PRISMA flow diagram data generation
- Full-text retrieval coordination

## Usage Guidelines

1. **MeSH Terms**: Use controlled vocabulary for precise searches
2. **PICO Framework**: Structure searches around population, intervention, comparison, outcome
3. **Screening**: Apply inclusion/exclusion criteria systematically
4. **PRISMA Compliance**: Generate required flow diagram data

## Tools/Libraries

- Biopython
- PyMed
- NCBI E-utilities
