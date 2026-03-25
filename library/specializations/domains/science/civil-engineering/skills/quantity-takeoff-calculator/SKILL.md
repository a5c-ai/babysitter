---
name: quantity-takeoff-calculator
description: Construction quantity takeoff skill for concrete, steel, earthwork, and materials
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
  category: Construction Management
  skill-id: CIV-SK-026
---

# Quantity Takeoff Calculator Skill

## Purpose

The Quantity Takeoff Calculator Skill calculates construction quantities including concrete volumes, steel weights, earthwork quantities, and material takeoffs from drawings or BIM models.

## Capabilities

- Concrete volume calculation
- Steel weight calculation
- Earthwork quantities
- Pipe and conduit lengths
- Area calculations (formwork, finishes)
- Unit conversion
- Waste factor application
- BIM-based takeoff

## Usage Guidelines

### When to Use
- Estimating project quantities
- Supporting cost estimates
- Verifying contractor quantities
- Planning material procurement

### Prerequisites
- Design documents available
- Takeoff categories defined
- Unit system established
- Waste factors identified

### Best Practices
- Use consistent methods
- Document measurement rules
- Apply appropriate waste factors
- Cross-check critical items

## Process Integration

This skill integrates with:
- Construction Cost Estimation
- Specifications Development

## Configuration

```yaml
quantity-takeoff-calculator:
  categories:
    - concrete
    - steel
    - earthwork
    - masonry
    - piping
  sources:
    - bim-model
    - drawings
    - cad
  units:
    - imperial
    - metric
```

## Output Artifacts

- Quantity summaries
- Material takeoffs
- Cost backup data
- BOM reports
