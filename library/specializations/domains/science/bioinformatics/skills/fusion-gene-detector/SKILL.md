---
name: fusion-gene-detector
description: Gene fusion detection skill for oncology applications with multiple caller integration
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
    - clinical-genomics
    - oncology
    - fusions
    - rna-seq
graph:
  domains: [domain:bioinformatics]
  specializations: [specialization:biomedical-informatics]
  skillAreas: [skill-area:graph-algorithms, skill-area:statistical-analysis, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-engineer, role:biomedical-engineer]
---

# Fusion Gene Detector Skill

## Purpose
Enable gene fusion detection for oncology applications with multiple caller integration.

## Capabilities
- RNA-based fusion calling
- DNA-based fusion detection
- Multi-caller consensus
- Visualization of fusion events
- Known fusion annotation
- Clinical actionability assessment

## Usage Guidelines
- Use multiple callers for sensitivity
- Build consensus from different algorithms
- Annotate with known fusion databases
- Visualize fusion breakpoints
- Assess clinical actionability
- Document caller combinations

## Dependencies
- STAR-Fusion
- Arriba
- FusionCatcher

## Process Integration
- Tumor Molecular Profiling (tumor-molecular-profiling)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
