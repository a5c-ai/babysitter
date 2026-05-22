---
name: scikit-hep-analysis
description: Scikit-HEP toolkit skill for particle physics data analysis with modern Python tools
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: physics
  domain: science
  category: data-analysis
  phase: 6
graph:
  domains: [domain:physics]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:data-analysis]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:research-scientist, role:computational-scientist]
---

# Scikit-HEP Analysis

## Purpose

Provides expert guidance on the Scikit-HEP ecosystem for particle physics data analysis with modern Python tools.

## Capabilities

- Awkward array manipulation
- uproot ROOT file I/O
- Histogram operations (hist, boost-histogram)
- Particle data access
- Vector operations
- pyhf statistical modeling

## Usage Guidelines

1. **Data I/O**: Read ROOT files with uproot
2. **Arrays**: Manipulate jagged data with Awkward
3. **Histogramming**: Create and manipulate histograms with hist
4. **Statistics**: Use pyhf for statistical modeling
5. **Analysis**: Build complete analysis workflows

## Tools/Libraries

- scikit-hep
- awkward
- uproot
- hist
- pyhf
