---
name: iso10993-evaluator
description: Biological evaluation planning skill implementing ISO 10993-1 for biocompatibility testing strategy
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
  skill-id: BME-SK-016
---

# ISO 10993 Evaluator Skill

## Purpose

The ISO 10993 Evaluator Skill supports biological evaluation planning per ISO 10993-1, determining biocompatibility testing requirements based on device categorization, contact type, and duration.

## Capabilities

- Device categorization (body contact, duration)
- Testing endpoint determination matrix
- Existing data evaluation guidance
- Equivalence assessment templates
- Gap analysis for testing requirements
- Biological evaluation plan generation
- Report template generation
- Risk-based testing strategy
- Alternative testing approaches
- Literature review guidance
- Toxicological risk assessment support

## Usage Guidelines

### When to Use
- Planning biocompatibility testing programs
- Evaluating existing biocompatibility data
- Assessing material equivalence
- Preparing biological evaluation reports

### Prerequisites
- Device materials identified
- Contact type and duration defined
- Manufacturing process documented
- Existing data compiled

### Best Practices
- Apply risk-based approach per ISO 10993-1:2018
- Evaluate existing data before new testing
- Consider material equivalence carefully
- Document rationale for testing decisions

## Process Integration

This skill integrates with the following processes:
- Biological Evaluation Planning (ISO 10993)
- Extractables and Leachables Analysis
- Biomaterial Selection and Characterization
- 510(k) Premarket Submission Preparation

## Dependencies

- ISO 10993 series standards
- FDA G95-1 guidance
- Material databases
- Testing laboratory capabilities
- Toxicological databases

## Configuration

```yaml
iso10993-evaluator:
  contact-categories:
    - surface-device
    - external-communicating
    - implant
  contact-types:
    - skin
    - mucosal-membrane
    - breached-surface
    - blood-path-indirect
    - tissue-bone
    - blood
  duration-categories:
    - limited
    - prolonged
    - permanent
```

## Output Artifacts

- Device categorization documents
- Testing requirement matrices
- Biological evaluation plans
- Gap analysis reports
- Equivalence assessments
- BER templates
- Literature review summaries
- Testing rationale documents

## Quality Criteria

- Categorization follows ISO 10993-1:2018
- Testing endpoints appropriate for device
- Existing data properly evaluated
- Equivalence arguments supported
- Gap analysis comprehensive
- Documentation supports regulatory review
