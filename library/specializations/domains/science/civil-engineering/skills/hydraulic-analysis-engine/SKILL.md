---
name: hydraulic-analysis-engine
description: Hydraulic analysis skill for open channel flow, culverts, and pipe networks
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
  category: Water Resources
  skill-id: CIV-SK-023
---

# Hydraulic Analysis Engine Skill

## Purpose

The Hydraulic Analysis Engine Skill performs hydraulic analysis for open channels, culverts, and pipe networks using Manning's equation and energy-momentum principles.

## Capabilities

- Open channel flow (Manning's equation)
- Culvert hydraulics (inlet/outlet control)
- Pipe network analysis
- Energy and momentum calculations
- Backwater analysis
- Spillway design calculations
- Critical and normal depth
- Gradually varied flow

## Usage Guidelines

### When to Use
- Sizing drainage structures
- Analyzing channel capacity
- Evaluating flood elevations
- Designing spillways

### Prerequisites
- Channel geometry defined
- Flow rates established
- Boundary conditions known
- Roughness values selected

### Best Practices
- Verify Manning's n values
- Check flow regime
- Consider tailwater effects
- Validate with observations

## Process Integration

This skill integrates with:
- Hydraulic Structure Design
- Stormwater Management Design
- Flood Analysis and Mitigation

## Configuration

```yaml
hydraulic-analysis-engine:
  analysis-types:
    - open-channel
    - culvert
    - pipe-network
    - spillway
  flow-types:
    - steady
    - unsteady
    - uniform
    - varied
```

## Output Artifacts

- Water surface profiles
- Culvert analysis
- Network solutions
- Energy grade lines
