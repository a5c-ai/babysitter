---
name: gsea-pathway-analyzer
description: Gene Set Enrichment Analysis skill for functional annotation and pathway interpretation
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
    - pathway-analysis
    - gsea
    - functional
---

# GSEA Pathway Analyzer Skill

## Purpose
Enable Gene Set Enrichment Analysis for functional annotation and pathway interpretation.

## Capabilities
- Preranked GSEA execution
- Gene ontology enrichment
- KEGG/Reactome pathway analysis
- Custom gene set support
- Leading edge analysis
- Publication-ready visualizations

## Usage Guidelines
- Rank genes appropriately for analysis type
- Select relevant gene set collections
- Apply multiple testing correction
- Identify leading edge genes for interpretation
- Generate clear visualizations
- Document gene set versions

## Dependencies
- GSEA
- clusterProfiler
- g:Profiler
- Enrichr

## Process Integration
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Multi-Omics Data Integration (multi-omics-integration)
