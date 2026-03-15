---
name: extractables-leachables-analyzer
description: E&L study design and data analysis skill for chemical characterization of medical devices
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
  skill-id: BME-SK-017
---

# Extractables and Leachables Analyzer Skill

## Purpose

The Extractables and Leachables Analyzer Skill supports E&L study design and data analysis for chemical characterization of medical devices per ISO 10993-18, including extraction study design and toxicological risk assessment.

## Capabilities

- Extraction solvent and condition selection
- Analytical method recommendations (GC-MS, LC-MS, ICP)
- AET (Analytical Evaluation Threshold) calculation
- Compound identification assistance
- Toxicological risk assessment templates
- ICH Q3D elemental impurity guidance
- Study protocol generation
- Data interpretation support
- Safety assessment reporting
- Simulated use extraction design
- Accelerated extraction studies

## Usage Guidelines

### When to Use
- Designing E&L characterization studies
- Analyzing E&L data
- Conducting toxicological risk assessments
- Preparing chemical characterization reports

### Prerequisites
- Device materials documented
- Contact conditions defined
- Analytical capabilities identified
- Toxicological resources available

### Best Practices
- Use risk-based approach per ISO 10993-18
- Consider worst-case extraction conditions
- Calculate AET based on patient exposure
- Document compound identification rationale

## Process Integration

This skill integrates with the following processes:
- Extractables and Leachables Analysis
- Biological Evaluation Planning (ISO 10993)
- Biomaterial Selection and Characterization
- 510(k) Premarket Submission Preparation

## Dependencies

- Mass spectral databases
- Toxicology databases (ToxNet)
- ISO 10993-18 standard
- ICH Q3D guidelines
- Analytical laboratory capabilities

## Configuration

```yaml
extractables-leachables-analyzer:
  extraction-types:
    - exhaustive-extraction
    - simulated-use
    - accelerated
  analytical-methods:
    - GC-MS
    - LC-MS
    - ICP-OES
    - ICP-MS
    - headspace-GC
  solvents:
    - polar
    - semi-polar
    - non-polar
```

## Output Artifacts

- E&L study protocols
- Extraction condition specifications
- Analytical method recommendations
- AET calculations
- Compound identification tables
- Toxicological risk assessments
- Chemical characterization reports
- Safety assessment summaries

## Quality Criteria

- Extraction conditions appropriate for device use
- Analytical methods detect relevant compounds
- AET properly calculated and applied
- Compound identification well-supported
- Toxicological assessment comprehensive
- Documentation supports regulatory review
