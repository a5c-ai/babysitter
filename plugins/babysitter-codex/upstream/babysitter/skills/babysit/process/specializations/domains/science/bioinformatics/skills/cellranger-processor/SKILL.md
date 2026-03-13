---
name: cellranger-processor
description: Cell Ranger skill for 10X Genomics single-cell data processing
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
    - single-cell
    - 10x-genomics
    - demultiplexing
---

# CellRanger Processor Skill

## Purpose
Provide Cell Ranger capabilities for 10X Genomics single-cell data processing including demultiplexing and alignment.

## Capabilities
- BCL to FASTQ conversion
- Cell barcode demultiplexing
- UMI counting
- Feature barcode processing
- Aggregate sample analysis
- Loupe Browser file generation

## Usage Guidelines
- Configure sample sheets accurately
- Validate cell counts against expectations
- Review QC metrics from web summary
- Aggregate samples for combined analysis
- Generate Loupe files for visualization
- Document reference versions

## Dependencies
- Cell Ranger
- STARsolo

## Process Integration
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Spatial Transcriptomics Analysis (spatial-transcriptomics)
