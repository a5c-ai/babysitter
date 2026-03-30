---
name: membrane-system-designer
description: Membrane separation system design skill for RO, UF, NF, and gas separation applications
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
  category: Separation Processes
  skill-id: CE-SK-011
---

# Membrane System Designer Skill

## Purpose

The Membrane System Designer Skill designs membrane separation systems including reverse osmosis, ultrafiltration, nanofiltration, and gas separation applications.

## Capabilities

- Membrane selection and sizing
- Module configuration design
- Permeate flux calculations
- Fouling prediction and mitigation
- Cleaning protocol design
- Multi-stage system design
- Recovery and rejection optimization
- Energy consumption analysis

## Usage Guidelines

### When to Use
- Designing membrane separation systems
- Optimizing existing installations
- Evaluating membrane alternatives
- Troubleshooting fouling issues

### Prerequisites
- Feed characterization complete
- Separation requirements defined
- Operating conditions specified
- Fouling potential assessed

### Best Practices
- Account for fouling in design
- Plan for membrane replacement
- Include adequate pretreatment
- Consider energy recovery

## Process Integration

This skill integrates with:
- Membrane Separation System Design
- Separation Sequence Synthesis
- Process Flow Diagram Development

## Configuration

```yaml
membrane-system-designer:
  membrane-types:
    - reverse-osmosis
    - nanofiltration
    - ultrafiltration
    - microfiltration
    - gas-separation
  configurations:
    - single-stage
    - multi-stage
    - recycle
```

## Output Artifacts

- System specifications
- Module datasheets
- Performance predictions
- Cleaning protocols
- Operating procedures
