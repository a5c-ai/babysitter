---
name: madgraph-amplitude-calculator
description: MadGraph matrix element calculation skill for BSM physics, cross-section computation, and event generation
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
    - MadGraph5_aMC@NLO
    - UFO models
    - FeynRules
  processes:
    - quantum-field-theory-calculations
    - beyond-standard-model-search
    - monte-carlo-event-generation
---

# MadGraph Amplitude Calculator Skill

## Purpose

Provides MadGraph5_aMC@NLO capabilities for automated matrix element calculation, cross-section computation, and parton-level event generation for Standard Model and BSM physics.

## Capabilities

- **UFO Model Import**: Load and validate Universal FeynRules Output models
- **Process Generation**: Generate Feynman diagrams and matrix elements automatically
- **NLO Calculations**: Next-to-leading order QCD corrections with MC@NLO matching
- **Event Generation**: Parton-level event generation with proper weights
- **Shower Matching**: Interface with Pythia/Herwig for parton shower matching
- **Cross Section Extraction**: Calculate cross sections with PDF and scale uncertainties

## Usage Guidelines

1. **Model Setup**
   - Import UFO model for BSM studies
   - Validate model parameters
   - Check particle content and interactions
   - Set model parameters (masses, couplings)

2. **Process Definition**
   - Define process using MadGraph syntax
   - Specify initial and final state particles
   - Add decay chains if needed
   - Apply generation-level cuts

3. **Calculation Settings**
   - Choose LO or NLO calculation
   - Configure PDF set and scale choices
   - Set number of events to generate
   - Enable/disable diagram classes

4. **Running and Output**
   - Launch calculations via command interface
   - Monitor progress and convergence
   - Save events in LHE format
   - Extract cross sections with uncertainties

5. **Best Practices**
   - Validate against known results
   - Check gauge invariance
   - Estimate scale and PDF uncertainties
   - Document all process definitions
