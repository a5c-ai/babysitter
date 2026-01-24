---
name: zemax-optical-designer
description: Zemax optical design skill for lens systems, imaging optics, and tolerancing analysis
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
  category: optics-photonics
  domain: physics
  tools:
    - Zemax OpticStudio
    - Python ZOS-API
  processes:
    - experiment-design-and-planning
    - detector-calibration-and-characterization
---

# Zemax Optical Designer Skill

## Purpose

Provides Zemax OpticStudio capabilities for optical system design, analysis, and tolerancing of imaging systems, illumination, and photonic devices.

## Capabilities

- **Sequential Ray Tracing**: Design and analyze lens systems
- **Non-Sequential Analysis**: Stray light and illumination modeling
- **Tolerance Analysis**: Manufacturing sensitivity assessment
- **MTF and PSF**: Calculate modulation transfer function and point spread function
- **Coating Optimization**: Design and optimize optical coatings
- **Stray Light Analysis**: Ghost and flare analysis

## Usage Guidelines

1. **System Setup**
   - Define aperture and field specifications
   - Select wavelengths and weights
   - Enter lens data (radii, thicknesses, materials)
   - Set up object and image planes

2. **Optimization**
   - Define merit function with operands
   - Select optimization variables
   - Run optimization algorithms
   - Iterate between local and global optimization

3. **Analysis**
   - Calculate spot diagrams for each field
   - Evaluate MTF at specified frequencies
   - Generate wavefront maps
   - Analyze distortion and aberrations

4. **Tolerancing**
   - Set manufacturing tolerances
   - Run sensitivity analysis
   - Determine compensator adjustments
   - Calculate yield predictions

5. **Best Practices**
   - Start with known design forms
   - Use glass substitution for manufacturability
   - Document design assumptions
   - Archive optimization history
