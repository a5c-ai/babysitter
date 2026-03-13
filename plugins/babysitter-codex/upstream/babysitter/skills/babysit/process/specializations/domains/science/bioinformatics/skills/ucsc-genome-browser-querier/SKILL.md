---
name: ucsc-genome-browser-querier
description: UCSC Genome Browser query skill for genome annotation retrieval and track data access
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
    - infrastructure
    - annotation
    - ucsc
    - tracks
---

# UCSC Genome Browser Querier Skill

## Purpose
Provide UCSC Genome Browser queries for genome annotation retrieval and track data access.

## Capabilities
- Track data retrieval
- Custom track upload
- Genome annotation queries
- Conservation score extraction
- Table browser queries
- bigWig/bigBed handling

## Usage Guidelines
- Query relevant annotation tracks
- Upload custom data for visualization
- Extract conservation scores for analysis
- Use Table Browser for data extraction
- Handle bigWig/bigBed formats efficiently
- Document genome assembly versions

## Dependencies
- UCSC API
- kent utilities
- pyBigWig

## Process Integration
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
