---
name: aero-database
description: Systematic generation and management of aerodynamic coefficient databases
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
    - database
    - coefficients
    - simulation
---

# Aerodynamic Database Generation Skill

## Purpose
Systematically generate, manage, and maintain aerodynamic coefficient databases for flight simulation, stability analysis, and performance prediction.

## Capabilities
- Multi-dimensional parameter sweep configuration
- Automated CFD job submission and monitoring
- Force and moment coefficient extraction
- Database interpolation and extrapolation
- Format conversion for flight simulation
- Database validation and consistency checks
- Version control and change tracking
- Documentation and metadata management

## Usage Guidelines
- Define comprehensive parameter ranges covering the flight envelope
- Ensure adequate resolution in critical regions (transonic, high angle of attack)
- Validate database consistency across parameter boundaries
- Implement robust interpolation schemes for smooth coefficient variations
- Maintain version control for database updates and modifications
- Document data sources, assumptions, and limitations

## Dependencies
- Database tools
- HPC job schedulers
- MATLAB
- Python data processing libraries

## Process Integration
- AE-003: Aerodynamic Database Generation
- AE-013: Flight Simulation Model Development
