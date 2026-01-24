---
name: seismic-hazard-analyzer
description: Seismic hazard analysis skill for site classification, spectral acceleration, and design response spectrum generation
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
  category: Structural Analysis
  skill-id: CIV-SK-004
---

# Seismic Hazard Analyzer Skill

## Purpose

The Seismic Hazard Analyzer Skill performs seismic hazard analysis including site classification, spectral acceleration determination, and design response spectrum generation per ASCE 7 and AASHTO.

## Capabilities

- Site classification determination (A-F)
- Spectral acceleration calculation (Ss, S1)
- Design response spectrum generation
- Seismic design category determination
- Site-specific hazard analysis
- USGS API integration for site data
- Risk-targeted ground motion parameters
- Site coefficient calculation

## Usage Guidelines

### When to Use
- Determining seismic design parameters
- Generating response spectra
- Classifying site conditions
- Establishing seismic design category

### Prerequisites
- Site location coordinates
- Geotechnical data for site class
- Risk category identified
- Design code version selected

### Best Practices
- Verify site classification
- Use site-specific data when available
- Consider local seismic provisions
- Document parameter sources

## Process Integration

This skill integrates with:
- Seismic Design Analysis
- Bridge Design LRFD
- Foundation Design

## Configuration

```yaml
seismic-hazard-analyzer:
  design-codes:
    - ASCE7-22
    - AASHTO-LRFD
  site-classes:
    - A
    - B
    - C
    - D
    - E
    - F
  output-types:
    - spectra
    - parameters
    - report
```

## Output Artifacts

- Design response spectra
- Seismic parameter summaries
- Site classification reports
- SDC determination
