---
name: motion-capture-analyzer
description: Motion capture data processing and analysis skill for gait analysis and biomechanical studies
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
  skill-id: BME-SK-014
---

# Motion Capture Analyzer Skill

## Purpose

The Motion Capture Analyzer Skill processes and analyzes motion capture data for gait analysis, biomechanical studies, and human factors research, supporting clinical evaluation and device validation.

## Capabilities

- Marker data processing and gap-filling
- Inverse kinematics calculation
- Ground reaction force analysis
- Joint angle computation
- Spatiotemporal parameter extraction
- Statistical parametric mapping
- Normative database comparison
- Gait cycle segmentation
- EMG synchronization
- Multi-trial averaging
- Variability analysis

## Usage Guidelines

### When to Use
- Processing motion capture data
- Conducting gait analysis studies
- Validating orthopedic devices
- Supporting clinical outcome assessments

### Prerequisites
- Motion capture data collected
- Marker protocol documented
- Calibration data available
- Subject anthropometry recorded

### Best Practices
- Verify marker tracking quality
- Apply appropriate filtering
- Use validated biomechanical models
- Compare with normative databases

## Process Integration

This skill integrates with the following processes:
- Gait Analysis and Musculoskeletal Modeling
- Human Factors Engineering and Usability
- Clinical Study Design and Execution
- Orthopedic Implant Biomechanical Testing

## Dependencies

- Vicon Nexus
- OptiTrack Motive
- Visual3D
- OpenSim
- MATLAB/Python processing tools

## Configuration

```yaml
motion-capture-analyzer:
  data-types:
    - marker-trajectories
    - force-plate
    - EMG
    - pressure-mapping
  analysis-outputs:
    - joint-angles
    - joint-moments
    - joint-powers
    - spatiotemporal
  filtering:
    - butterworth
    - spline
    - moving-average
```

## Output Artifacts

- Processed marker trajectories
- Joint kinematics
- Kinetic data
- Spatiotemporal parameters
- Gait reports
- Normative comparisons
- Statistical analysis results
- Visualization plots

## Quality Criteria

- Marker tracking gaps minimized
- Filtering parameters appropriate
- Model scaling accurate
- Results validated against norms
- Statistical analysis rigorous
- Documentation supports clinical interpretation
