---
name: ada-compliance-checker
description: ADA accessibility compliance checking skill for routes, slopes, and pedestrian facilities
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: civil-engineering
  domain: science
  category: Code Compliance
  skill-id: CIV-SK-032
---

# ADA Compliance Checker Skill

## Purpose

The ADA Compliance Checker Skill verifies accessibility compliance for pedestrian facilities including routes, slopes, ramps, and curb ramps per ADA requirements.

## Capabilities

- Accessible route analysis
- Slope and cross-slope checking
- Ramp design verification
- Curb ramp compliance
- Detectable warning requirements
- Parking accessibility
- Clear width verification
- Level landing requirements

## Usage Guidelines

### When to Use
- Verifying accessibility
- Designing accessible routes
- Evaluating curb ramps
- Checking parking layouts

### Prerequisites
- Facility design complete
- Survey data available
- Grade information known
- Width dimensions provided

### Best Practices
- Check all routes
- Verify slopes in field
- Consider maintenance
- Document exceptions

## Process Integration

This skill integrates with:
- Highway Geometric Design
- Permit Application Preparation

## Configuration

```yaml
ada-compliance-checker:
  standards:
    - ADA
    - PROWAG
    - ADAAG
  check-types:
    - slopes
    - widths
    - landings
    - curb-ramps
    - detectable-warnings
```

## Output Artifacts

- Compliance reports
- Slope analysis
- Deficiency lists
- Improvement recommendations
