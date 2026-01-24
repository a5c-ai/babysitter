---
name: delphes-fast-simulator
description: Delphes fast detector simulation skill for phenomenological studies and BSM searches
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
    - Delphes
    - FastJet
    - ROOT
  processes:
    - event-reconstruction
    - beyond-standard-model-search
    - experiment-design-and-planning
---

# Delphes Fast Simulator Skill

## Purpose

Provides Delphes fast detector simulation capabilities for rapid phenomenological studies, allowing realistic detector effects without full Geant4 simulation.

## Capabilities

- **Detector Card Configuration**: Configure detector parameters for ATLAS, CMS, or custom detectors
- **Jet Reconstruction**: Multiple jet algorithms via FastJet integration
- **Object Efficiency**: Parameterize reconstruction efficiencies as function of pt and eta
- **Pile-up Simulation**: Model multiple interactions per bunch crossing
- **Trigger Emulation**: Implement trigger selections at analysis level
- **ROOT Output**: Standard ROOT tree format compatible with analysis frameworks

## Usage Guidelines

1. **Detector Configuration**
   - Start with standard ATLAS or CMS card
   - Customize resolutions and efficiencies
   - Configure jet algorithm and parameters
   - Set b-tagging working points

2. **Input Processing**
   - Read HepMC or LHE input files
   - Configure particle propagation
   - Set pile-up conditions
   - Enable/disable specific modules

3. **Object Reconstruction**
   - Electrons, muons with efficiency/fake rates
   - Photons with isolation criteria
   - Jets with flavor tagging
   - Missing transverse energy

4. **Output Analysis**
   - Access reconstructed objects from ROOT tree
   - Apply additional selection cuts
   - Calculate kinematic variables
   - Interface with analysis frameworks

5. **Best Practices**
   - Validate against full simulation when possible
   - Document detector card modifications
   - Use consistent pile-up conditions
   - Compare with collaboration performance plots
