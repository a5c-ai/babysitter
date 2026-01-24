---
name: comsol-multiphysics-modeler
description: COMSOL finite element skill for multiphysics simulations including electromagnetics, heat transfer, and fluid dynamics
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
  category: numerical-simulation
  domain: physics
  tools:
    - COMSOL Multiphysics
    - LiveLink for MATLAB
  processes:
    - experiment-design-and-planning
    - data-acquisition-system-development
    - spectroscopy-measurement-campaign
---

# COMSOL Multiphysics Modeler Skill

## Purpose

Provides COMSOL Multiphysics finite element modeling capabilities for coupled physics simulations spanning electromagnetics, heat transfer, structural mechanics, and fluid dynamics.

## Capabilities

- **Geometry Import**: Import and modify CAD geometries, create parametric models
- **Meshing**: Configure structured and unstructured meshes with adaptive refinement
- **Physics Configuration**: Set up single and coupled physics interfaces
- **Boundary Conditions**: Define boundary conditions, initial conditions, and constraints
- **Parametric Sweeps**: Automate parameter variation studies
- **Results Processing**: Extract, visualize, and export simulation results
- **LiveLink Scripting**: Automate workflows using MATLAB or Python

## Usage Guidelines

1. **Model Setup**
   - Import or create geometry with appropriate simplifications
   - Assign material properties from library or custom definitions
   - Select physics interfaces based on problem requirements
   - Define appropriate boundary and initial conditions

2. **Mesh Configuration**
   - Start with coarse mesh for initial testing
   - Refine in regions with high gradients
   - Use boundary layers for fluid flow and thin structures
   - Perform mesh convergence study

3. **Solver Configuration**
   - Choose appropriate solver (stationary, time-dependent, frequency)
   - Configure solver tolerances
   - Enable segregated solving for multiphysics
   - Use parametric or auxiliary sweeps as needed

4. **Post-Processing**
   - Define derived quantities and integration probes
   - Create publication-quality plots
   - Export data for external analysis
   - Document all model settings

5. **Best Practices**
   - Validate against analytical solutions when available
   - Document model assumptions
   - Use version control for model files
   - Archive parameter study results
