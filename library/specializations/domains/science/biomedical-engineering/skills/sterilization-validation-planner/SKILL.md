---
name: sterilization-validation-planner
description: Sterilization process validation planning skill for EO, radiation, and steam sterilization
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
  category: Sterilization and Manufacturing
  skill-id: BME-SK-026
---

# Sterilization Validation Planner Skill

## Purpose

The Sterilization Validation Planner Skill supports sterilization process development and validation for medical devices, ensuring sterility assurance levels per ISO standards and FDA guidance.

## Capabilities

- Sterilization method selection guidance
- Bioburden determination protocol
- Dose setting (ISO 11137) or half-cycle development
- IQ/OQ/PQ protocol templates
- Sterility test requirements
- Parametric release guidance
- Revalidation scheduling
- Material compatibility assessment
- Biological indicator selection
- Process challenge device design
- Dose audit planning

## Usage Guidelines

### When to Use
- Selecting sterilization methods
- Planning validation activities
- Developing validation protocols
- Establishing revalidation programs

### Prerequisites
- Product materials characterized
- Packaging system defined
- Bioburden data available
- Sterilization facility identified

### Best Practices
- Select method based on material compatibility
- Validate worst-case configurations
- Plan for ongoing process monitoring
- Document all parameters thoroughly

## Process Integration

This skill integrates with the following processes:
- Sterilization Validation
- Sterile Barrier System Validation
- Design for Manufacturing and Assembly (DFMA)
- Design Control Process Implementation

## Dependencies

- ISO 11135 (EO)
- ISO 11137 (radiation)
- ISO 17665 (steam)
- AAMI standards
- Sterilization service providers

## Configuration

```yaml
sterilization-validation-planner:
  methods:
    - ethylene-oxide
    - gamma-radiation
    - e-beam
    - steam
    - dry-heat
  validation-phases:
    - IQ
    - OQ
    - PQ
  sal-targets:
    - 10-3
    - 10-6
```

## Output Artifacts

- Method selection rationale
- Bioburden protocols
- Dose setting reports
- IQ/OQ/PQ protocols
- Validation reports
- Parametric release procedures
- Revalidation schedules
- Monitoring plans

## Quality Criteria

- Method appropriate for product
- SAL target achieved
- Validation protocols comprehensive
- Material compatibility verified
- Parametric release justified
- Revalidation program established
