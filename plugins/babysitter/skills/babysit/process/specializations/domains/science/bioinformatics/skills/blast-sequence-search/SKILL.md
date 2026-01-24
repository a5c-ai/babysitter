---
name: blast-sequence-search
description: BLAST skill for sequence similarity searching, homology detection, and database querying
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
    - sequence-analysis
    - blast
    - homology
    - database-search
---

# BLAST Sequence Search Skill

## Purpose
Provide BLAST capabilities for sequence similarity searching, homology detection, and database querying across nucleotide and protein sequences.

## Capabilities
- BLASTn/BLASTp/BLASTx execution
- Custom database creation and management
- E-value and alignment filtering
- Output parsing and result annotation
- Batch query processing
- Remote NCBI database queries

## Usage Guidelines
- Select appropriate BLAST program for query/database type
- Set E-value thresholds based on search sensitivity needs
- Create custom databases for project-specific searches
- Parse and filter results for downstream analysis
- Consider computational resources for large searches
- Document database versions for reproducibility

## Dependencies
- NCBI BLAST+
- DIAMOND
- MMseqs2

## Process Integration
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Protein Structure Prediction (protein-structure-prediction)
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
