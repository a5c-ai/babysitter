---
name: biocompatibility-test-selector
description: Biocompatibility test selection and protocol recommendation skill based on device categorization
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
  category: Biocompatibility and Materials
  skill-id: BME-SK-018
---

# Biocompatibility Test Selector Skill

## Purpose

The Biocompatibility Test Selector Skill recommends appropriate biocompatibility tests and protocols based on device categorization, supporting biological evaluation planning and test laboratory coordination.

## Capabilities

- Test battery recommendation by category
- ISO 10993 part selection guidance
- Test lab capability assessment
- Protocol review checklist
- In vitro vs. in vivo decision support
- Alternative testing approaches (21st century toxicology)
- Cost and timeline estimation
- Sample requirement calculation
- Control material selection
- Test article preparation guidance
- Results interpretation support

## Usage Guidelines

### When to Use
- Selecting biocompatibility tests
- Planning testing programs
- Evaluating alternative methods
- Coordinating with test laboratories

### Prerequisites
- Device categorization completed
- Materials characterized
- Testing gaps identified
- Budget and timeline constraints known

### Best Practices
- Prioritize in vitro methods where validated
- Consider 3Rs (Replace, Reduce, Refine)
- Select appropriate positive/negative controls
- Plan for sufficient sample quantities

## Process Integration

This skill integrates with the following processes:
- Biological Evaluation Planning (ISO 10993)
- Biomaterial Selection and Characterization
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation

## Dependencies

- ISO 10993 test standards
- ICCVAM alternative methods
- Test laboratory databases
- Sample preparation guidelines
- Control material sources

## Configuration

```yaml
biocompatibility-test-selector:
  test-categories:
    - cytotoxicity
    - sensitization
    - irritation
    - acute-toxicity
    - subchronic-toxicity
    - genotoxicity
    - implantation
    - hemocompatibility
  method-preferences:
    - in-vitro-first
    - validated-alternatives
    - traditional
```

## Output Artifacts

- Test battery recommendations
- Protocol specifications
- Sample requirements
- Cost estimates
- Timeline projections
- Lab capability assessments
- Control material lists
- Results interpretation guides

## Quality Criteria

- Tests appropriate for device category
- Protocols reference current standards
- Sample quantities adequate
- Cost estimates realistic
- Timelines achievable
- Alternative methods considered
