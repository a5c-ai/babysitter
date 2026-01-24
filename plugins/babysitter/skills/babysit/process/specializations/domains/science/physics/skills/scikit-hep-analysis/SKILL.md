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
  - Task
metadata:
  version: "1.0"
  category: data-analysis
  domain: physics
  tools:
    - scikit-hep
    - awkward
    - uproot
    - hist
    - pyhf
  processes:
    - statistical-analysis-pipeline
    - event-reconstruction
    - beyond-standard-model-search
---

# Scikit-HEP Analysis Skill

## Purpose

Provides Scikit-HEP ecosystem capabilities for modern particle physics data analysis using Pythonic tools for ROOT files, histograms, and statistical inference.

## Capabilities

- **Awkward Arrays**: Handle jagged/nested data structures efficiently
- **uproot I/O**: Read and write ROOT files without ROOT dependency
- **Histogram Operations**: Create and manipulate histograms with hist/boost-histogram
- **Particle Data**: Access PDG particle properties
- **Vector Operations**: Lorentz vector manipulations
- **pyhf Statistics**: HistFactory statistical models in Python

## Usage Guidelines

1. **Data Access**
   - Use uproot to read ROOT files
   - Convert to awkward arrays for analysis
   - Select branches lazily for memory efficiency
   - Handle jagged data naturally

2. **Histogram Analysis**
   - Create histograms with hist library
   - Fill with efficient vectorized operations
   - Apply rebinning and projections
   - Export to ROOT or other formats

3. **Vector Operations**
   - Use vector library for Lorentz vectors
   - Compute invariant masses
   - Apply boosts and rotations
   - Handle coordinate systems

4. **Statistical Analysis**
   - Build pyhf models for limit setting
   - Configure systematic uncertainties
   - Run asymptotic or toy-based inference
   - Produce Brazil band plots

5. **Best Practices**
   - Profile memory usage for large datasets
   - Use dask for distributed processing
   - Document column selections
   - Validate against ROOT-based analysis
