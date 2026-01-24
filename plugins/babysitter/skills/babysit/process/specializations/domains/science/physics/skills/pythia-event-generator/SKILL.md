---
name: pythia-event-generator
description: Pythia event generation skill for proton-proton and lepton collisions at high energies
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
    - Pythia8
    - HepMC
    - LHAPDF
  processes:
    - monte-carlo-event-generation
    - beyond-standard-model-search
    - statistical-analysis-pipeline
---

# Pythia Event Generator Skill

## Purpose

Provides Pythia8 event generation capabilities for simulating high-energy particle collisions including hard processes, parton showers, hadronization, and underlying event.

## Capabilities

- **Process Selection**: Configure hard scattering processes for various physics studies
- **PDF Management**: Interface with LHAPDF for parton distribution functions
- **Hadronization**: Lund string fragmentation for jet formation
- **Underlying Event**: Multiparton interactions and beam remnants
- **HepMC Output**: Standard output format for detector simulation
- **Shower Matching**: MLM and CKKW-L matching with matrix element generators

## Usage Guidelines

1. **Process Configuration**
   - Select processes via Pythia settings
   - Configure phase space cuts for efficiency
   - Set beam energies and types
   - Enable/disable specific decay channels

2. **PDF Setup**
   - Use LHAPDF6 for modern PDF sets
   - Select appropriate PDF for the process
   - Consider PDF uncertainties

3. **Tuning**
   - Use official collaboration tunes
   - Validate against minimum bias data
   - Check jet substructure observables
   - Adjust primordial kT if needed

4. **Output Generation**
   - Write events in HepMC format
   - Store generator-level truth information
   - Enable/disable specific particles in output
   - Document random seeds for reproducibility

5. **Best Practices**
   - Validate against experimental data
   - Compare with alternative generators
   - Estimate theoretical uncertainties
   - Document all settings used
