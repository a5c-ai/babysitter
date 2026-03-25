---
name: prosthetics-design-optimizer
description: Prosthetics and orthotics design optimization skill integrating biomechanical requirements with manufacturing constraints
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
  category: Medical Imaging
  skill-id: BME-SK-032
---

# Prosthetics Design Optimizer Skill

## Purpose

The Prosthetics Design Optimizer Skill supports design optimization of prosthetics and orthotics, integrating biomechanical analysis, patient-specific customization, and manufacturing constraints.

## Capabilities

- Socket design parameterization
- Load distribution analysis
- Alignment optimization
- Component selection guidance
- Suspension system design
- Cosmesis integration
- Patient-specific customization from scanning
- Gait analysis integration
- Comfort assessment metrics
- Range of motion optimization
- Weight optimization

## Usage Guidelines

### When to Use
- Designing prosthetic/orthotic devices
- Optimizing socket fit
- Selecting components
- Customizing for individual patients

### Prerequisites
- Patient assessment completed
- Residual limb/anatomy scanned
- Activity level determined
- Component options identified

### Best Practices
- Integrate gait analysis data
- Optimize for patient activity level
- Consider long-term wear patterns
- Plan for adjustment needs

## Process Integration

This skill integrates with the following processes:
- Gait Analysis and Musculoskeletal Modeling
- Finite Element Analysis for Medical Devices
- Design Control Process Implementation
- Human Factors Engineering and Usability

## Dependencies

- CAD/CAM systems
- 3D scanning systems
- OpenSim
- Gait analysis data
- Component databases

## Configuration

```yaml
prosthetics-design-optimizer:
  device-types:
    - transtibial
    - transfemoral
    - upper-extremity
    - AFO
    - KAFO
    - spinal
  design-parameters:
    - socket-geometry
    - alignment
    - suspension
    - cosmesis
  analysis-types:
    - FEA
    - gait-integration
    - comfort-mapping
```

## Output Artifacts

- Socket design specifications
- Alignment parameters
- Component recommendations
- CAD models
- FEA reports
- Fitting protocols
- Adjustment guidelines
- Patient documentation

## Quality Criteria

- Design meets biomechanical requirements
- Socket fit optimized for comfort
- Alignment appropriate for gait
- Components suitable for activity level
- Manufacturing feasible
- Documentation supports clinical fitting
