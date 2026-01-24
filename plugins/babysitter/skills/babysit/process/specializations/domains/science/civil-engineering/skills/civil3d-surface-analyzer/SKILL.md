---
name: civil3d-surface-analyzer
description: Civil 3D surface analysis skill for terrain modeling, earthwork, and drainage analysis
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
  category: Site Design
  skill-id: CIV-SK-017
---

# Civil 3D Surface Analyzer Skill

## Purpose

The Civil 3D Surface Analyzer Skill performs terrain surface analysis including slope analysis, cut/fill calculations, drainage analysis, and earthwork quantity computation.

## Capabilities

- Surface analysis (slope, elevation, contours)
- Cut/fill volume calculation
- Drainage analysis
- Corridor modeling
- Cross-section generation
- Earthwork quantities
- Surface comparison
- Watershed delineation

## Usage Guidelines

### When to Use
- Analyzing site topography
- Calculating earthwork volumes
- Evaluating drainage patterns
- Designing corridors

### Prerequisites
- Survey data available
- Surface model created
- Design criteria defined
- Section intervals established

### Best Practices
- Verify surface accuracy
- Use appropriate comparison methods
- Consider shrink/swell factors
- Document calculation methods

## Process Integration

This skill integrates with:
- Highway Geometric Design
- Stormwater Management Design
- Slope Stability Analysis

## Configuration

```yaml
civil3d-surface-analyzer:
  analysis-types:
    - slope
    - elevation
    - drainage
    - volumes
  surface-types:
    - existing
    - proposed
    - corridor
  output-formats:
    - report
    - xml
    - csv
```

## Output Artifacts

- Surface analysis maps
- Volume reports
- Drainage diagrams
- Cross-sections
