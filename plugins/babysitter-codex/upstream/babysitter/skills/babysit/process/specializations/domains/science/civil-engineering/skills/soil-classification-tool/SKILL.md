---
name: soil-classification-tool
description: Soil classification skill using USCS and AASHTO systems with SPT correlations
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
  category: Geotechnical Analysis
  skill-id: CIV-SK-013
---

# Soil Classification Tool Skill

## Purpose

The Soil Classification Tool Skill classifies soils using USCS and AASHTO systems, interprets Atterberg limits, and provides SPT correlation calculations for engineering properties.

## Capabilities

- USCS classification
- AASHTO soil classification
- Atterberg limits interpretation
- Grain size distribution analysis
- Soil description generator
- SPT correlation calculations
- Relative density estimation
- Consistency determination

## Usage Guidelines

### When to Use
- Classifying soil samples
- Interpreting laboratory data
- Estimating engineering properties
- Preparing geotechnical reports

### Prerequisites
- Laboratory test data available
- Grain size distribution known
- Atterberg limits tested
- SPT values recorded

### Best Practices
- Follow standard procedures
- Consider local correlations
- Document sample quality
- Verify visual description

## Process Integration

This skill integrates with:
- Geotechnical Site Investigation

## Configuration

```yaml
soil-classification-tool:
  systems:
    - USCS
    - AASHTO
  correlations:
    - SPT-friction-angle
    - SPT-undrained-strength
    - SPT-relative-density
  outputs:
    - classification
    - description
    - properties
```

## Output Artifacts

- Soil classifications
- Property correlations
- Boring logs
- Soil descriptions
