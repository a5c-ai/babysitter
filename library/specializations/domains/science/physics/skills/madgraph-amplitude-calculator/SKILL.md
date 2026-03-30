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
metadata:
  specialization: physics
  domain: science
  category: particle-physics
  phase: 6
---

# MadGraph Amplitude Calculator

## Purpose

Provides expert guidance on MadGraph matrix element calculations for BSM physics, including UFO model import, NLO calculations, and shower matching.

## Capabilities

- UFO model import and validation
- Process generation and optimization
- NLO calculation setup
- Parton-level event generation
- Shower matching with Pythia/Herwig
- Cross-section extraction with uncertainties

## Usage Guidelines

1. **Model Import**: Import UFO models for BSM physics
2. **Process Generation**: Generate matrix elements for desired processes
3. **NLO Corrections**: Configure NLO calculations when needed
4. **Matching**: Set up shower matching for hadronization
5. **Uncertainties**: Evaluate scale and PDF uncertainties

## Tools/Libraries

- MadGraph5_aMC@NLO
- UFO models
- FeynRules
