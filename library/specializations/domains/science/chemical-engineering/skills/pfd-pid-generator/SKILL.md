---
name: pfd-pid-generator
description: Process flow diagram and P&ID generation skill with standards compliance and symbol libraries
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
  category: Process Design
  skill-id: CE-SK-029
---

# PFD/P&ID Generator Skill

## Purpose

The PFD/P&ID Generator Skill creates process flow diagrams and piping and instrumentation diagrams following industry standards with appropriate symbology and documentation.

## Capabilities

- PFD development with heat/mass balance
- P&ID development per ISA standards
- Equipment numbering systems
- Instrument identification
- Line numbering and specifications
- Control loop representation
- Safety system documentation
- Revision management
- Drawing cross-references

## Usage Guidelines

### When to Use
- Developing new PFDs/P&IDs
- Updating existing drawings
- Standardizing documentation
- Supporting design reviews

### Prerequisites
- Process design basis defined
- Equipment list available
- Control philosophy developed
- Standards specified

### Best Practices
- Follow company standards
- Maintain consistency
- Include all required information
- Manage revisions properly

## Process Integration

This skill integrates with:
- Process Flow Diagram Development
- Control Strategy Development
- Equipment Sizing and Specification

## Configuration

```yaml
pfd-pid-generator:
  standards:
    - ISA-5.1
    - ISO-10628
    - PIP
  symbol-libraries:
    - equipment
    - instruments
    - valves
    - piping
```

## Output Artifacts

- Process flow diagrams
- Piping & instrumentation diagrams
- Equipment lists
- Instrument lists
- Line lists
