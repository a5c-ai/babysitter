---
name: root-data-analyzer
description: ROOT/CERN data analysis skill for high-energy physics data processing, histogramming, and statistical analysis
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
  category: particle-physics
  domain: physics
  tools:
    - ROOT
    - RooFit
    - RooStats
    - uproot
  processes:
    - statistical-analysis-pipeline
    - event-reconstruction
    - monte-carlo-event-generation
    - beyond-standard-model-search
---

# ROOT Data Analyzer Skill

## Purpose

Provides ROOT/CERN framework capabilities for high-energy physics data analysis including tree manipulation, histogram fitting, statistical modeling with RooFit, and publication-quality visualization.

## Capabilities

- **TTree/TChain Manipulation**: Read, filter, and process large datasets stored in ROOT format
- **Histogram Operations**: Create, fill, and manipulate histograms with proper error handling
- **RooFit Modeling**: Build statistical models for signal extraction and fitting
- **TCanvas Visualization**: Create publication-quality plots and figures
- **ROOT Macro Development**: Write and debug ROOT macros in C++ and Python
- **PyROOT Integration**: Seamless Python interface for analysis workflows

## Usage Guidelines

1. **Data Access**
   - Use TChain for processing multiple files
   - Apply selections using Draw() or explicit loops
   - Enable branches selectively for performance
   - Use uproot for Python-native access

2. **Histogram Analysis**
   - Choose appropriate binning for physics
   - Handle overflow/underflow correctly
   - Propagate statistical uncertainties
   - Use TEfficiency for efficiency calculations

3. **Statistical Fitting**
   - Build RooFit models for signal and background
   - Perform likelihood fits with proper error handling
   - Use RooStats for limit setting and discovery
   - Validate fits with pull distributions

4. **Visualization**
   - Follow collaboration style guidelines
   - Include proper axis labels and units
   - Add legends and annotations
   - Export in vector formats for publication

5. **Best Practices**
   - Document analysis cuts and selections
   - Implement blinding for sensitive analyses
   - Use version control for analysis code
   - Archive intermediate results
