---
name: scaffold-design-optimizer
description: Tissue engineering scaffold design optimization skill for pore size, porosity, and mechanical properties
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
  category: Tissue Engineering
  skill-id: BME-SK-029
---

# Scaffold Design Optimizer Skill

## Purpose

The Scaffold Design Optimizer Skill supports tissue engineering scaffold design, optimizing pore architecture, porosity, and mechanical properties for specific tissue regeneration applications.

## Capabilities

- Pore architecture design (gradient, uniform)
- Porosity calculation and optimization
- Mechanical property prediction
- Degradation rate modeling
- Surface area calculation
- Nutrient transport modeling
- Fabrication parameter recommendations
- Cell seeding optimization
- Vascularization considerations
- Material selection guidance
- CAD model generation

## Usage Guidelines

### When to Use
- Designing tissue engineering scaffolds
- Optimizing scaffold architecture
- Predicting scaffold performance
- Selecting fabrication methods

### Prerequisites
- Target tissue defined
- Mechanical requirements established
- Material options identified
- Fabrication capabilities known

### Best Practices
- Match pore size to target tissue
- Balance porosity with mechanical strength
- Consider degradation timeline
- Validate with cell studies

## Process Integration

This skill integrates with the following processes:
- Scaffold Fabrication and Characterization
- Cell Culture and Tissue Construct Development
- Biomaterial Selection and Characterization
- Design Control Process Implementation

## Dependencies

- CAD software
- Lattice structure generators
- FEA tools
- Tissue engineering literature
- Fabrication equipment specs

## Configuration

```yaml
scaffold-design-optimizer:
  architecture-types:
    - gyroid
    - diamond
    - cubic
    - gradient
    - random
  target-tissues:
    - bone
    - cartilage
    - skin
    - vascular
    - neural
  optimization-objectives:
    - porosity
    - pore-size
    - mechanical-strength
    - permeability
```

## Output Artifacts

- Scaffold design specifications
- CAD models
- Porosity calculations
- Mechanical property predictions
- Degradation profiles
- Fabrication parameters
- Cell seeding protocols
- Characterization plans

## Quality Criteria

- Design meets tissue requirements
- Porosity appropriate for application
- Mechanical properties adequate
- Degradation rate matched to healing
- Fabrication feasible
- Documentation supports regulatory review
