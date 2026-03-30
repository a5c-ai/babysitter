---
name: detention-pond-designer
description: Detention/retention pond design skill for storage, outlet structures, and emergency spillways
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
  skill-id: CIV-SK-024
---

# Detention Pond Designer Skill

## Purpose

The Detention Pond Designer Skill designs stormwater detention and retention facilities including storage volumes, outlet structures, and emergency spillways.

## Capabilities

- Storage volume calculation
- Outlet structure sizing
- Stage-storage-discharge relationships
- Multi-stage outlet design
- Emergency spillway sizing
- Sediment storage calculation
- Water quality volume
- Routing analysis

## Usage Guidelines

### When to Use
- Designing detention basins
- Sizing outlet structures
- Meeting regulatory requirements
- Evaluating water quality treatment

### Prerequisites
- Inflow hydrographs available
- Release rate requirements known
- Site constraints identified
- Regulatory criteria established

### Best Practices
- Size for multiple storms
- Include freeboard
- Plan for maintenance access
- Consider downstream impacts

## Process Integration

This skill integrates with:
- Stormwater Management Design

## Configuration

```yaml
detention-pond-designer:
  design-types:
    - detention
    - retention
    - extended-detention
  outlets:
    - orifice
    - weir
    - riser
    - multi-stage
  routing:
    - modified-puls
    - storage-indication
```

## Output Artifacts

- Storage calculations
- Outlet sizing
- Stage-storage-discharge curves
- Routing summaries
