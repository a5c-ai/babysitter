---
name: fatigue-life-predictor
description: Fatigue life prediction skill for implants and load-bearing devices using validated approaches
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
  skill-id: BME-SK-013
---

# Fatigue Life Predictor Skill

## Purpose

The Fatigue Life Predictor Skill estimates fatigue life of medical implants and load-bearing devices using established methodologies per ASTM and ISO standards, supporting design verification and regulatory submissions.

## Capabilities

- S-N curve generation and analysis
- Strain-life fatigue modeling
- Multiaxial fatigue assessment
- Fretting fatigue evaluation
- Corrosion fatigue considerations
- Goodman diagram construction
- Run-out criteria application
- Notch sensitivity analysis
- Statistical treatment of fatigue data
- Design allowable determination
- Fatigue test correlation

## Usage Guidelines

### When to Use
- Predicting implant fatigue life
- Designing fatigue testing protocols
- Correlating FEA with bench testing
- Supporting design verification

### Prerequisites
- Stress analysis completed
- Material fatigue properties available
- Loading spectrum defined
- Surface finish characterized

### Best Practices
- Use appropriate fatigue methodology for loading type
- Account for mean stress effects
- Consider physiological environment effects
- Correlate predictions with bench testing

## Process Integration

This skill integrates with the following processes:
- Finite Element Analysis for Medical Devices
- Orthopedic Implant Biomechanical Testing
- Design Control Process Implementation
- Verification and Validation Test Planning

## Dependencies

- fe-safe software
- ANSYS nCode
- ASTM F1717/F2077 standards
- Material fatigue databases
- FEA stress results

## Configuration

```yaml
fatigue-life-predictor:
  methodologies:
    - stress-life
    - strain-life
    - fracture-mechanics
  loading-types:
    - constant-amplitude
    - variable-amplitude
    - multiaxial
  mean-stress-corrections:
    - Goodman
    - Gerber
    - Morrow
  environment:
    - air
    - saline
    - body-fluid
```

## Output Artifacts

- Fatigue life predictions
- S-N curves
- Goodman diagrams
- Safety factor calculations
- Test correlation reports
- Design recommendations
- Statistical analysis results
- Regulatory submission summaries

## Quality Criteria

- Methodology appropriate for loading conditions
- Material data from validated sources
- Mean stress effects properly accounted
- Environmental factors considered
- Predictions correlated with testing
- Documentation supports regulatory review
