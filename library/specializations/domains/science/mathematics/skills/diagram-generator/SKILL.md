---
name: diagram-generator
description: Mathematical diagram and visualization generation
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: mathematics
  domain: science
  category: documentation
  phase: 6
graph:
  domains: [domain:mathematics]
  specializations: [specialization:computational-mathematics]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:statistical-analysis, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:computational-scientist]
---

# Diagram Generator

## Purpose

Provides mathematical diagram and visualization generation for clear communication of mathematical concepts.

## Capabilities

- Commutative diagrams (tikz-cd)
- Function plots (pgfplots)
- Graph drawings (tikz)
- 3D surface plots
- Phase portraits
- Geometric constructions

## Usage Guidelines

1. **Diagram Type**: Choose appropriate visualization type
2. **Style Consistency**: Maintain consistent styling
3. **Labels**: Clear and informative labeling
4. **Export Format**: Generate vector graphics when possible

## Tools/Libraries

- TikZ
- PGFPlots
- Asymptote
- matplotlib
