---
name: salmon-quantifier
description: Salmon pseudo-alignment skill for fast and accurate transcript quantification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: bioinformatics
  tags:
    - transcriptomics
    - quantification
    - rna-seq
    - pseudo-alignment
graph:
  domains: [domain:bioinformatics]
  specializations: [specialization:biomedical-informatics]
  skillAreas: [skill-area:statistical-analysis, skill-area:python-data-pipelines, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-engineer, role:biomedical-engineer]
---

# Salmon Quantifier Skill

## Purpose
Enable Salmon pseudo-alignment for fast and accurate transcript quantification.

## Capabilities
- Selective alignment mode
- GC bias correction
- Mapping rate assessment
- Bootstrap uncertainty estimation
- Multi-mapping resolution
- Decoy-aware indexing

## Usage Guidelines
- Build decoy-aware indices for accuracy
- Enable GC bias correction
- Use selective alignment for improved accuracy
- Generate bootstraps for uncertainty estimation
- Validate mapping rates against expectations
- Document index and parameter versions

## Dependencies
- Salmon
- kallisto
- RSEM

## Process Integration
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
