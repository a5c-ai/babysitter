---
name: opensim-modeler
description: OpenSim musculoskeletal modeling skill for biomechanical simulation and analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Biomechanics and Structural Analysis
  skill-id: BME-SK-015
---

# OpenSim Modeler Skill

## Purpose

The OpenSim Modeler Skill facilitates musculoskeletal modeling and simulation using OpenSim, supporting biomechanical analysis, device design, and clinical research applications.

## Capabilities

- Model scaling to subject anthropometry
- Inverse kinematics and dynamics
- Static optimization
- Computed muscle control
- Joint reaction analysis
- Custom model development
- Prosthetic/orthotic integration
- Muscle force estimation
- Metabolic cost prediction
- Sensitivity analysis
- Model validation workflows

## Usage Guidelines

### When to Use
- Creating subject-specific musculoskeletal models
- Estimating muscle forces and joint loads
- Evaluating prosthetic/orthotic designs
- Supporting surgical planning

### Prerequisites
- Motion capture data available
- Subject anthropometric measurements
- Base musculoskeletal model selected
- Experimental markers defined

### Best Practices
- Validate model scaling with experimental data
- Assess inverse kinematics residuals
- Verify physiological muscle activations
- Document model modifications

## Process Integration

This skill integrates with the following processes:
- Gait Analysis and Musculoskeletal Modeling
- Orthopedic Implant Biomechanical Testing
- Clinical Study Design and Execution
- Human Factors Engineering and Usability

## Dependencies

- OpenSim software
- MATLAB/Python scripting
- Motion capture data
- Musculoskeletal model libraries
- Computational resources

## Configuration

```yaml
opensim-modeler:
  model-types:
    - lower-extremity
    - upper-extremity
    - full-body
    - spine
  analysis-tools:
    - inverse-kinematics
    - inverse-dynamics
    - static-optimization
    - CMC
    - joint-reaction
  output-variables:
    - muscle-forces
    - joint-moments
    - joint-reactions
    - metabolic-cost
```

## Output Artifacts

- Scaled musculoskeletal models
- Kinematics results
- Muscle force estimates
- Joint reaction forces
- Simulation reports
- Validation metrics
- Sensitivity analysis results
- Visualization files

## Quality Criteria

- Model scaling matches subject anthropometry
- Inverse kinematics residuals acceptable
- Muscle activations physiologically plausible
- Joint reactions validated where possible
- Results reproducible
- Documentation complete
