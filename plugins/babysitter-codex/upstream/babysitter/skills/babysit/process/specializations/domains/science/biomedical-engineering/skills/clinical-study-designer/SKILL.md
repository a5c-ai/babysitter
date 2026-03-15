---
name: clinical-study-designer
description: Clinical study design skill for medical device trials including IDE studies and post-market studies
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
  category: Clinical Evidence
  skill-id: BME-SK-024
---

# Clinical Study Designer Skill

## Purpose

The Clinical Study Designer Skill supports design of clinical studies for medical devices, including IDE studies, post-market studies, and registries, ensuring scientific rigor and regulatory acceptance.

## Capabilities

- Study design selection (RCT, single-arm, registry)
- Endpoint definition guidance
- Sample size calculation (superiority, non-inferiority, equivalence)
- Protocol template generation
- Informed consent template generation
- CRF design assistance
- Statistical analysis plan development
- Randomization strategy
- Blinding methodology
- Interim analysis planning
- Adaptive design support

## Usage Guidelines

### When to Use
- Designing clinical trials
- Calculating sample sizes
- Developing protocols
- Planning statistical analyses

### Prerequisites
- Clinical objectives defined
- Target population identified
- Comparator strategy determined
- Regulatory pathway established

### Best Practices
- Select design appropriate for objectives
- Ensure adequate statistical power
- Plan for missing data
- Include clinically meaningful endpoints

## Process Integration

This skill integrates with the following processes:
- Clinical Study Design and Execution
- Clinical Evaluation Report Development
- AI/ML Medical Device Development
- Post-Market Surveillance System Implementation

## Dependencies

- PASS software
- nQuery
- FDA IDE guidance
- ISO 14155 standard
- Statistical analysis tools

## Configuration

```yaml
clinical-study-designer:
  study-designs:
    - randomized-controlled
    - single-arm
    - crossover
    - registry
    - real-world-evidence
  hypothesis-types:
    - superiority
    - non-inferiority
    - equivalence
  endpoint-types:
    - primary
    - secondary
    - exploratory
```

## Output Artifacts

- Protocol documents
- Statistical analysis plans
- Sample size calculations
- Informed consent templates
- CRF designs
- Randomization schemes
- Study synopses
- IDE submission components

## Quality Criteria

- Design appropriate for clinical question
- Sample size adequately powered
- Endpoints clinically meaningful
- Protocol comprehensive
- SAP statistically rigorous
- Documentation supports regulatory acceptance
