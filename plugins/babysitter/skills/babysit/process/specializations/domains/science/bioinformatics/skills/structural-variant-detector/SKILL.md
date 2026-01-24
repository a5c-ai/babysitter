---
name: structural-variant-detector
description: Structural variant detection skill for identifying CNVs, inversions, translocations, and complex rearrangements
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
    - variant-analysis
    - structural-variants
    - cnv
    - sv
---

# Structural Variant Detector Skill

## Purpose
Enable structural variant detection for identifying CNVs, inversions, translocations, and complex rearrangements.

## Capabilities
- Split-read and paired-end SV calling
- Copy number variation detection
- Mobile element insertion detection
- Complex SV resolution
- SV annotation and visualization
- Multi-caller integration

## Usage Guidelines
- Use multiple callers for comprehensive detection
- Integrate results from different algorithms
- Validate SVs with independent methods
- Annotate SVs with functional impact
- Visualize SVs for manual review
- Document caller combinations and filters

## Dependencies
- Manta
- DELLY
- CNVkit
- LUMPY
- GRIDSS

## Process Integration
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Tumor Molecular Profiling (tumor-molecular-profiling)
- Long-Read Sequencing Analysis (long-read-analysis)
