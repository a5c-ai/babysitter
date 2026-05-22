---
name: pymol-visualizer
description: PyMOL molecular visualization skill for structure rendering and analysis
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
    - structural-biology
    - visualization
    - pymol
    - rendering
graph:
  domains: [domain:bioinformatics]
  specializations: [specialization:biomedical-informatics]
  skillAreas: [skill-area:data-visualization, skill-area:data-analysis, skill-area:python-data-pipelines]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:lab-technician]
---

# PyMOL Visualizer Skill

## Purpose
Enable PyMOL molecular visualization for structure rendering and analysis.

## Capabilities
- Protein structure visualization
- Surface representation
- Binding site highlighting
- Movie and animation generation
- Publication-quality images
- Scripted visualization pipelines

## Usage Guidelines
- Select appropriate representation styles
- Highlight functionally important regions
- Generate consistent visualizations
- Create animations for presentations
- Export high-resolution images
- Document visualization parameters

## Dependencies
- PyMOL
- ChimeraX
- VMD
- NGLview

## Process Integration
- Protein Structure Prediction (protein-structure-prediction)
- Molecular Docking and Virtual Screening (molecular-docking)
