---
name: image-algorithm-validator
description: Medical image processing algorithm validation skill for segmentation, detection, and analysis algorithms
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
  skill-id: BME-SK-031
---

# Image Algorithm Validator Skill

## Purpose

The Image Algorithm Validator Skill supports validation of medical image processing algorithms, including segmentation, detection, and analysis algorithms, ensuring performance meets clinical requirements.

## Capabilities

- Ground truth dataset curation guidance
- Performance metric calculation (Dice, IoU, sensitivity, specificity)
- Inter-observer variability analysis
- Statistical comparison methods
- Validation dataset stratification
- Multi-reader multi-case study design
- FDA AI/ML guidance alignment
- Failure case analysis
- Edge case identification
- Performance boundary testing
- Cross-validation methodology

## Usage Guidelines

### When to Use
- Validating image analysis algorithms
- Curating validation datasets
- Designing reader studies
- Preparing regulatory submissions

### Prerequisites
- Algorithm development complete
- Ground truth established
- Validation dataset available
- Performance criteria defined

### Best Practices
- Use representative, diverse datasets
- Establish robust ground truth methodology
- Assess performance across subgroups
- Document failure modes

## Process Integration

This skill integrates with the following processes:
- Medical Image Processing Algorithm Development
- AI/ML Medical Device Development
- Clinical Evaluation Report Development
- Software Verification and Validation

## Dependencies

- SimpleITK library
- scikit-image
- MONAI framework
- Evaluation frameworks
- Statistical analysis tools

## Configuration

```yaml
image-algorithm-validator:
  algorithm-types:
    - segmentation
    - detection
    - classification
    - registration
    - quantification
  metrics:
    - Dice
    - IoU
    - sensitivity
    - specificity
    - AUC
    - Hausdorff-distance
  validation-methods:
    - holdout
    - cross-validation
    - external-validation
```

## Output Artifacts

- Dataset curation protocols
- Ground truth documentation
- Performance reports
- Statistical analyses
- Reader study results
- Failure mode catalogs
- Regulatory submission sections
- Validation summaries

## Quality Criteria

- Ground truth methodology validated
- Metrics appropriate for algorithm type
- Dataset representative of intended use
- Statistical analysis rigorous
- Subgroup performance assessed
- Documentation supports regulatory review
