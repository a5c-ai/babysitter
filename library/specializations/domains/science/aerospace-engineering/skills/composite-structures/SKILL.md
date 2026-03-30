---
name: composite-structures
description: Expert skill for composite aerospace structure design and analysis
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
  category: aerospace-engineering
  tags:
    - structural-analysis
    - composites
    - laminate-design
    - materials
---

# Composite Structures Skill

## Purpose
Enable expert composite aerospace structure design and analysis including laminate optimization, failure prediction, and manufacturing considerations.

## Capabilities
- Laminate analysis and optimization
- Classical laminate theory (CLT) calculations
- Ply failure criteria (Tsai-Wu, Hashin, LaRC)
- Stacking sequence optimization
- Manufacturing constraint consideration
- Repair analysis and substantiation
- Allowables database management
- Impact damage assessment

## Usage Guidelines
- Apply appropriate failure criteria based on loading and material system
- Consider manufacturing constraints in laminate design (ply drops, tool access)
- Use building block approach for allowables development
- Account for environmental effects (temperature, moisture)
- Design for inspectability and repairability
- Document material and process specifications completely

## Dependencies
- HyperSizer
- ESACOMP
- Laminate tools
- NASTRAN

## Process Integration
- AE-009: Composite Structure Design
