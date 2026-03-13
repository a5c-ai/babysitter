---
name: bioreactor-protocol-generator
description: Bioreactor culture protocol development skill for tissue construct maturation
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
  category: Tissue Engineering
  skill-id: BME-SK-030
---

# Bioreactor Protocol Generator Skill

## Purpose

The Bioreactor Protocol Generator Skill develops culture protocols for tissue construct maturation in bioreactor systems, optimizing mechanical conditioning and perfusion parameters.

## Capabilities

- Bioreactor type selection guidance
- Mechanical conditioning protocol design
- Perfusion flow rate optimization
- Gas exchange parameter calculation
- Culture duration recommendations
- Monitoring parameter identification
- Aseptic technique checklists
- Media formulation guidance
- Stimulation regime design
- Scale-up considerations
- Quality control protocols

## Usage Guidelines

### When to Use
- Developing bioreactor culture protocols
- Optimizing tissue maturation
- Scaling up tissue production
- Establishing quality controls

### Prerequisites
- Scaffold design finalized
- Cell source identified
- Bioreactor system selected
- Target tissue properties defined

### Best Practices
- Start with literature-based parameters
- Monitor key indicators continuously
- Implement aseptic protocols rigorously
- Document all parameter changes

## Process Integration

This skill integrates with the following processes:
- Cell Culture and Tissue Construct Development
- Scaffold Fabrication and Characterization
- Design Control Process Implementation
- Verification and Validation Test Planning

## Dependencies

- Bioreactor specifications
- Culture optimization literature
- Media suppliers
- Monitoring equipment
- Aseptic processing guidelines

## Configuration

```yaml
bioreactor-protocol-generator:
  bioreactor-types:
    - spinner-flask
    - rotating-wall
    - perfusion
    - compression
    - tensile
  stimulation-modes:
    - mechanical
    - electrical
    - magnetic
    - combined
  monitoring-parameters:
    - pH
    - dissolved-oxygen
    - glucose
    - lactate
```

## Output Artifacts

- Bioreactor selection rationale
- Culture protocols
- Stimulation parameters
- Media specifications
- Monitoring schedules
- Aseptic procedures
- Quality control criteria
- Scale-up plans

## Quality Criteria

- Protocol achieves target tissue properties
- Parameters within equipment capabilities
- Monitoring adequate for process control
- Aseptic technique ensures sterility
- Documentation supports reproducibility
- Scale-up considerations addressed
