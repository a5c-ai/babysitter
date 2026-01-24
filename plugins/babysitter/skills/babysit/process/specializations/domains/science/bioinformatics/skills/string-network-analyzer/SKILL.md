---
name: string-network-analyzer
description: STRING protein interaction network skill for functional enrichment and network visualization
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
    - proteomics
    - network
    - interaction
    - functional
---

# STRING Network Analyzer Skill

## Purpose
Provide STRING protein interaction network analysis for functional enrichment and network visualization.

## Capabilities
- Protein-protein interaction queries
- Network clustering
- Functional enrichment analysis
- Cytoscape integration
- Network visualization
- Interaction confidence scoring

## Usage Guidelines
- Query interactions with appropriate confidence thresholds
- Cluster networks to identify modules
- Perform functional enrichment on modules
- Visualize networks with meaningful layouts
- Export to Cytoscape for advanced visualization
- Document confidence thresholds and filters

## Dependencies
- STRING-db
- Cytoscape
- NetworkX

## Process Integration
- Mass Spectrometry Proteomics Pipeline (ms-proteomics-pipeline)
- Multi-Omics Data Integration (multi-omics-integration)
