---
name: material-model-library
description: Biomaterial constitutive model library skill providing validated material properties for biological tissues and implant materials
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
  skill-id: BME-SK-012
---

# Material Model Library Skill

## Purpose

The Material Model Library Skill provides validated constitutive models and material properties for biological tissues and implant materials, supporting accurate biomechanical simulations and device design.

## Capabilities

- Tissue material property database (bone, cartilage, soft tissue)
- Hyperelastic model parameter sets (Mooney-Rivlin, Ogden)
- Viscoelastic and poroelastic models
- Implant material database (Ti-6Al-4V, CoCrMo, PEEK)
- Degradation model parameters
- Temperature and rate-dependent properties
- Anisotropic material definitions
- Age and disease-state variations
- Material property uncertainty quantification
- Literature reference compilation
- Custom material fitting tools

## Usage Guidelines

### When to Use
- Assigning material properties for FEA
- Selecting materials for device design
- Validating simulation models
- Conducting parametric studies

### Prerequisites
- Analysis type defined
- Loading conditions characterized
- Relevant tissue/material types identified
- Accuracy requirements established

### Best Practices
- Verify material sources and validation status
- Consider patient-specific variations
- Account for rate-dependency when relevant
- Document material model assumptions

## Process Integration

This skill integrates with the following processes:
- Finite Element Analysis for Medical Devices
- Biomaterial Selection and Characterization
- Orthopedic Implant Biomechanical Testing
- Scaffold Fabrication and Characterization

## Dependencies

- Material property databases
- Literature compilations
- Experimental characterization data
- FEA software material libraries
- Material testing standards

## Configuration

```yaml
material-model-library:
  tissue-types:
    - cortical-bone
    - cancellous-bone
    - cartilage
    - tendon
    - ligament
    - muscle
    - skin
    - vascular
  implant-materials:
    - Ti-6Al-4V
    - CoCrMo
    - PEEK
    - UHMWPE
    - stainless-steel
  model-types:
    - linear-elastic
    - hyperelastic
    - viscoelastic
    - poroelastic
```

## Output Artifacts

- Material property datasets
- Constitutive model parameters
- Material cards for FEA software
- Property validation reports
- Literature reference lists
- Uncertainty quantification data
- Material selection recommendations
- Model fitting results

## Quality Criteria

- Material properties from validated sources
- Model parameters appropriate for loading conditions
- Uncertainty properly characterized
- References properly documented
- Models validated against experimental data
- Assumptions clearly stated
