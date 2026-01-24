---
name: humann-functional-profiler
description: HUMAnN functional profiling skill for metagenomic pathway analysis
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
    - functional
    - pathway
    - metabolism
---

# HUMAnN Functional Profiler Skill

## Purpose
Provide HUMAnN functional profiling for metagenomic pathway analysis.

## Capabilities
- Gene family quantification
- MetaCyc pathway abundance
- UniRef annotation
- Stratified functional profiles
- Pathway coverage analysis
- Custom database integration

## Usage Guidelines
- Run taxonomic profiling first
- Quantify gene families and pathways
- Stratify by organism when relevant
- Analyze pathway coverage
- Compare functional profiles
- Document database versions

## Dependencies
- HUMAnN3
- eggNOG-mapper
- Prokka

## Process Integration
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
