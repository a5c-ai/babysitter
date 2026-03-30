---
name: building-code-checker
description: Building code compliance checking skill for IBC occupancy, construction type, and area requirements
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
  category: Code Compliance
  skill-id: CIV-SK-030
---

# Building Code Checker Skill

## Purpose

The Building Code Checker Skill verifies building code compliance including occupancy classification, construction type, allowable area, and fire-resistance requirements per IBC.

## Capabilities

- IBC compliance verification
- Occupancy classification
- Construction type determination
- Allowable area calculation
- Fire-resistance requirements
- Means of egress analysis
- Height and story limitations
- Mixed-use provisions

## Usage Guidelines

### When to Use
- Verifying code compliance
- Determining allowable areas
- Checking height limits
- Evaluating fire resistance

### Prerequisites
- Building use defined
- Construction materials identified
- Building area calculated
- Fire protection systems known

### Best Practices
- Use current code edition
- Consider local amendments
- Document compliance path
- Check all occupancies

## Process Integration

This skill integrates with:
- All structural processes
- Permit Application Preparation

## Configuration

```yaml
building-code-checker:
  codes:
    - IBC-2021
    - IBC-2024
  check-categories:
    - occupancy
    - construction-type
    - area
    - height
    - fire-resistance
    - egress
```

## Output Artifacts

- Compliance reports
- Area calculations
- Fire-resistance requirements
- Code summaries
