---
name: highway-alignment-designer
description: Highway alignment design skill for horizontal and vertical geometry per AASHTO standards
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
  category: Transportation Design
  skill-id: CIV-SK-018
---

# Highway Alignment Designer Skill

## Purpose

The Highway Alignment Designer Skill designs horizontal and vertical highway alignments including curves, superelevation, and sight distance per AASHTO Green Book standards.

## Capabilities

- Horizontal curve design (simple, compound, reverse, spiral)
- Vertical curve design (crest, sag)
- Superelevation calculation
- Sight distance analysis
- Cross-section template generation
- AASHTO Green Book compliance checking
- Design exception documentation
- Corridor modeling support

## Usage Guidelines

### When to Use
- Designing new roadways
- Evaluating existing alignments
- Checking sight distances
- Developing superelevation

### Prerequisites
- Design speed established
- Terrain classification known
- Design criteria selected
- Survey data available

### Best Practices
- Coordinate H and V alignment
- Verify sight distances
- Consider driver expectations
- Document any exceptions

## Process Integration

This skill integrates with:
- Highway Geometric Design
- Bridge Design LRFD

## Configuration

```yaml
highway-alignment-designer:
  curve-types:
    - simple
    - compound
    - reverse
    - spiral
  standards:
    - AASHTO
    - state-DOT
  output-formats:
    - xml
    - landxml
    - csv
```

## Output Artifacts

- Alignment geometry
- Superelevation diagrams
- Sight distance reports
- Design summaries
