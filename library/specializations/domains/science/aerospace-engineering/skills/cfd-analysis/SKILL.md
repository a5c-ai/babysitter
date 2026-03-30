---
name: cfd-analysis
description: Deep integration with computational fluid dynamics tools for aerodynamic analysis across all flight regimes
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: aerospace-engineering
  tags:
    - aerodynamics
    - cfd
    - simulation
    - fluid-dynamics
---

# CFD Analysis Skill

## Purpose
Provide deep integration with computational fluid dynamics tools for comprehensive aerodynamic analysis across subsonic, transonic, supersonic, and hypersonic flight regimes.

## Capabilities
- ANSYS Fluent, OpenFOAM, Star-CCM+ workflow automation
- Mesh generation and quality assessment
- Turbulence model selection and configuration
- Boundary condition specification for various flow regimes
- Post-processing and force/moment extraction
- Mesh independence study automation
- Flow visualization and contour generation
- Convergence monitoring and criteria definition

## Usage Guidelines
- Select appropriate turbulence models based on flow regime and Reynolds number
- Ensure mesh quality metrics meet industry standards before running simulations
- Perform mesh independence studies to validate solution accuracy
- Use appropriate boundary conditions for the specific flight condition
- Monitor residuals and force/moment convergence during simulations
- Document all simulation parameters for traceability and reproducibility

## Dependencies
- ANSYS Fluent
- OpenFOAM
- Star-CCM+
- ParaView
- Tecplot

## Process Integration
- AE-001: CFD Analysis Workflow
- AE-002: Wind Tunnel Test Correlation
- AE-003: Aerodynamic Database Generation
