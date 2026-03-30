---
name: consequence-modeler
description: Consequence analysis skill for dispersion modeling, fire/explosion analysis, and effect zone determination
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: chemical-engineering
  domain: science
  category: Process Safety
  skill-id: CE-SK-017
---

# Consequence Modeler Skill

## Purpose

The Consequence Modeler Skill performs consequence analysis for hazardous material releases including dispersion modeling, fire and explosion effects, and determination of effect zones.

## Capabilities

- Source term modeling
- Atmospheric dispersion (Gaussian, dense gas)
- Pool fire modeling
- Jet fire modeling
- Vapor cloud explosion (VCE) analysis
- BLEVE modeling
- Toxic effect assessment
- Effect zone mapping

## Usage Guidelines

### When to Use
- Quantifying release consequences
- Establishing effect zones
- Supporting siting studies
- Emergency planning

### Prerequisites
- Release scenarios defined
- Material properties available
- Site meteorological data
- Receptor locations identified

### Best Practices
- Use appropriate dispersion models
- Consider atmospheric stability
- Account for terrain effects
- Document modeling assumptions

## Process Integration

This skill integrates with:
- Consequence Analysis
- HAZOP Study Facilitation
- Emergency Response Planning

## Configuration

```yaml
consequence-modeler:
  models:
    - PHAST
    - ALOHA
    - custom-gaussian
  consequence-types:
    - toxic-dispersion
    - flammable-dispersion
    - fire
    - explosion
```

## Output Artifacts

- Consequence reports
- Effect zone maps
- Dispersion plots
- Fire/explosion analysis
- Risk contours
