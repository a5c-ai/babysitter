---
name: kraken2-taxonomic-classifier
description: Kraken2 taxonomic classification skill for rapid metagenomic read assignment
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
    - taxonomy
    - classification
    - kraken
graph:
  domains: [domain:bioinformatics]
  specializations: [specialization:biomedical-informatics]
  skillAreas: [skill-area:graph-algorithms, skill-area:python-data-pipelines, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-engineer, role:biomedical-engineer]
---

# Kraken2 Taxonomic Classifier Skill

## Purpose
Provide Kraken2 taxonomic classification for rapid metagenomic read assignment.

## Capabilities
- k-mer based classification
- Custom database creation
- Confidence score filtering
- Bracken abundance estimation
- Multi-sample reporting
- Memory-efficient operation

## Usage Guidelines
- Build or download appropriate databases
- Set confidence thresholds for accuracy
- Use Bracken for abundance estimation
- Generate reports for visualization
- Consider memory requirements
- Document database versions

## Dependencies
- Kraken2
- Bracken
- Centrifuge

## Process Integration
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
- 16S rRNA Microbiome Analysis (16s-microbiome-analysis)
