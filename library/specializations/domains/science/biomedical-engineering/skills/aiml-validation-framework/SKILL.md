---
name: aiml-validation-framework
description: AI/ML medical device validation skill implementing FDA's GMLP principles
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
  category: Medical Device Software
  skill-id: BME-SK-021
---

# AI/ML Validation Framework Skill

## Purpose

The AI/ML Validation Framework Skill supports validation of AI/ML-enabled medical devices per FDA Good Machine Learning Practice (GMLP) principles, addressing data quality, model performance, and predetermined change control.

## Capabilities

- Training data quality assessment
- Ground truth labeling validation
- Model performance metrics calculation (AUC, sensitivity, specificity)
- Subgroup performance analysis
- Bias and fairness evaluation
- Predetermined change control plan (PCCP) templates
- Clinical validation study design
- Locked algorithm vs. adaptive documentation
- Model explainability documentation
- Performance monitoring planning
- Real-world performance tracking

## Usage Guidelines

### When to Use
- Validating AI/ML algorithms
- Assessing training data quality
- Planning clinical validation studies
- Preparing FDA AI/ML submissions

### Prerequisites
- Algorithm development complete
- Training/test datasets curated
- Ground truth established
- Intended use clearly defined

### Best Practices
- Document data management practices
- Validate on diverse populations
- Plan for performance monitoring
- Consider predetermined change control

## Process Integration

This skill integrates with the following processes:
- AI/ML Medical Device Development
- Software Verification and Validation
- Clinical Evaluation Report Development
- Post-Market Surveillance System Implementation

## Dependencies

- FDA AI/ML guidance
- GMLP principles
- Fairness toolkits (AIF360, Fairlearn)
- Statistical analysis tools
- Clinical study resources

## Configuration

```yaml
aiml-validation-framework:
  algorithm-types:
    - locked
    - adaptive
    - continuously-learning
  performance-metrics:
    - AUC
    - sensitivity
    - specificity
    - PPV
    - NPV
  subgroup-categories:
    - age
    - sex
    - race
    - disease-severity
```

## Output Artifacts

- Data management documentation
- Algorithm description documents
- Performance reports
- Bias/fairness assessments
- PCCP documents
- Clinical validation protocols
- Monitoring plans
- FDA submission sections

## Quality Criteria

- Training data quality documented
- Ground truth methodology validated
- Performance meets clinical requirements
- Subgroup performance acceptable
- Bias assessments completed
- PCCP appropriate for algorithm type
