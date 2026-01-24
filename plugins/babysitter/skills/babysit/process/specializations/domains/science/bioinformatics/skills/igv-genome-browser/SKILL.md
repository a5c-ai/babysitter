---
name: igv-genome-browser
description: IGV integration skill for interactive genome visualization and review
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
    - visualization
    - igv
    - genome-browser
---

# IGV Genome Browser Skill

## Purpose
Enable IGV integration for interactive genome visualization and review.

## Capabilities
- BAM/VCF/BED visualization
- Batch screenshot generation
- Session management
- Track customization
- Region navigation
- Multi-sample comparison

## Usage Guidelines
- Load appropriate reference genome
- Configure tracks for analysis needs
- Generate batch screenshots for reports
- Save sessions for reproducibility
- Navigate to regions of interest
- Compare multiple samples visually

## Dependencies
- IGV
- IGV.js
- JBrowse2

## Process Integration
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Tumor Molecular Profiling (tumor-molecular-profiling)
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
