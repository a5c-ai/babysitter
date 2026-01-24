---
name: metaphlan-profiler
description: MetaPhlAn metagenomic profiling skill for species-level community composition
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
    - metagenomics
    - profiling
    - species
    - community
---

# MetaPhlAn Profiler Skill

## Purpose
Enable MetaPhlAn metagenomic profiling for species-level community composition.

## Capabilities
- Clade-specific marker gene analysis
- Species-level quantification
- Strain-level profiling (StrainPhlAn)
- Unknown species estimation
- Multi-sample heatmaps
- Comparative analysis

## Usage Guidelines
- Use latest marker database
- Profile at species level for most analyses
- Apply strain-level analysis when relevant
- Visualize community composition
- Compare across samples and conditions
- Document database versions

## Dependencies
- MetaPhlAn4
- StrainPhlAn
- mOTUs

## Process Integration
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
