---
name: clinical-literature-reviewer
description: Systematic literature review skill for clinical evaluation supporting regulatory submissions
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
  skill-id: BME-SK-023
---

# Clinical Literature Reviewer Skill

## Purpose

The Clinical Literature Reviewer Skill conducts systematic literature reviews for clinical evaluation, supporting medical device regulatory submissions with evidence synthesis per MEDDEV 2.7/1 and FDA guidance.

## Capabilities

- Literature search strategy development (PubMed, Embase, Cochrane)
- PICO framework application
- Abstract screening criteria
- Data extraction templates
- Appraisal of clinical data quality
- Evidence synthesis and summary tables
- MEDDEV 2.7/1 compliance checking
- Bias assessment tools
- Meta-analysis support
- Gap analysis for clinical evidence
- Ongoing literature surveillance

## Usage Guidelines

### When to Use
- Conducting clinical evidence reviews
- Supporting CER development
- Identifying evidence gaps
- Preparing regulatory submissions

### Prerequisites
- Clinical claims defined
- Search strategy approved
- Inclusion/exclusion criteria established
- Appraisal methodology selected

### Best Practices
- Document search methodology completely
- Apply consistent screening criteria
- Assess study quality systematically
- Synthesize evidence objectively

## Process Integration

This skill integrates with the following processes:
- Clinical Evaluation Report Development
- Clinical Study Design and Execution
- EU MDR Technical Documentation
- Post-Market Surveillance System Implementation

## Dependencies

- PubMed API
- Cochrane Library
- Embase database
- Systematic review tools
- Reference management software

## Configuration

```yaml
clinical-literature-reviewer:
  databases:
    - PubMed
    - Embase
    - Cochrane
    - Web-of-Science
  review-types:
    - systematic
    - scoping
    - rapid
  appraisal-tools:
    - GRADE
    - Oxford-CEBM
    - Cochrane-RoB
```

## Output Artifacts

- Search strategies
- Screening logs
- Data extraction tables
- Quality appraisal forms
- Evidence synthesis reports
- PRISMA diagrams
- Summary of evidence tables
- Gap analysis reports

## Quality Criteria

- Search comprehensive and reproducible
- Screening criteria consistently applied
- Data extraction accurate
- Quality appraisal systematic
- Synthesis methodology appropriate
- Documentation meets MEDDEV 2.7/1
