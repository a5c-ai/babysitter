---
name: geant4-detector-simulator
description: Geant4 detector simulation skill for particle transport, detector geometry, and physics process modeling
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
    - Geant4
    - GDML
    - ROOT
  processes:
    - experiment-design-and-planning
    - event-reconstruction
    - systematic-uncertainty-evaluation
---

# Geant4 Detector Simulator Skill

## Purpose

Provides Geant4 Monte Carlo simulation capabilities for modeling particle interactions with matter, detector response simulation, and experiment design optimization.

## Capabilities

- **Geometry Construction**: Build detector geometries using C++ or GDML
- **Physics List Selection**: Configure appropriate physics processes for the application
- **Sensitive Detector Implementation**: Define active detector volumes and hit collection
- **Hit Digitization**: Convert energy deposits to detector signals
- **Visualization Configuration**: Set up OpenGL or Qt visualization
- **Multi-threading Optimization**: Parallelize simulations across CPU cores

## Usage Guidelines

1. **Geometry Definition**
   - Define world volume as outermost container
   - Build logical and physical volumes hierarchically
   - Use parameterized volumes for repetitive structures
   - Import complex geometries via GDML

2. **Physics Configuration**
   - Select physics list based on application
   - Use FTFP_BERT for HEP applications
   - Use Shielding for radiation transport
   - Add optical physics if needed

3. **Sensitive Detectors**
   - Register sensitive detector classes
   - Define hit collection structure
   - Implement ProcessHits method
   - Handle multiple hits per event

4. **Running Simulations**
   - Initialize run manager correctly
   - Use /run/beamOn for event generation
   - Enable multi-threading for performance
   - Save output in ROOT or custom format

5. **Best Practices**
   - Validate geometry with /geometry/test commands
   - Compare with analytical solutions when possible
   - Document physics list choices
   - Version control simulation code
