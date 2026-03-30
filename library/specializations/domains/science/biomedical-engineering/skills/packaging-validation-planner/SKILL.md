---
name: packaging-validation-planner
description: Sterile barrier system validation planning skill per ISO 11607
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
  skill-id: BME-SK-027
---

# Packaging Validation Planner Skill

## Purpose

The Packaging Validation Planner Skill supports sterile barrier system development and validation per ISO 11607, ensuring package integrity and shelf life determination for medical devices.

## Capabilities

- Packaging material qualification guidance
- Seal strength optimization protocols
- Package integrity test selection
- Accelerated aging study design (ASTM F1980)
- Distribution simulation planning (ISTA protocols)
- Shelf life determination
- Packaging validation protocol templates
- Peel testing methodology
- Visual inspection criteria
- Worst-case condition identification
- Stability protocol development

## Usage Guidelines

### When to Use
- Developing packaging systems
- Planning validation activities
- Designing aging studies
- Establishing shelf life claims

### Prerequisites
- Package design finalized
- Sterilization method selected
- Distribution conditions defined
- Shelf life targets established

### Best Practices
- Validate worst-case configurations
- Use appropriate aging factors
- Include distribution simulation
- Plan for real-time aging correlation

## Process Integration

This skill integrates with the following processes:
- Sterile Barrier System Validation
- Sterilization Validation
- Design Control Process Implementation
- Design for Manufacturing and Assembly (DFMA)

## Dependencies

- ISO 11607 standard
- ASTM F1980 guidance
- ISTA test protocols
- Packaging test laboratories
- Environmental chambers

## Configuration

```yaml
packaging-validation-planner:
  package-types:
    - pouch
    - tray-lidding
    - header-bag
    - thermoform
  test-methods:
    - seal-strength
    - burst-test
    - dye-penetration
    - visual-inspection
  aging-types:
    - accelerated
    - real-time
```

## Output Artifacts

- Material qualification protocols
- Seal strength specifications
- IQ/OQ/PQ protocols
- Aging study protocols
- Distribution test plans
- Validation reports
- Shelf life justification
- Stability protocols

## Quality Criteria

- Package meets ISO 11607 requirements
- Seal strength adequate for handling
- Integrity maintained through aging
- Distribution simulation passed
- Shelf life claim justified
- Documentation complete
