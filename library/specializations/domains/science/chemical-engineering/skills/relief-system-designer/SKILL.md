---
name: relief-system-designer
description: Pressure relief system design skill for PSV sizing, flare header analysis, and overpressure protection
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
  category: Process Safety
  skill-id: CE-SK-016
---

# Relief System Designer Skill

## Purpose

The Relief System Designer Skill designs pressure relief systems including PSV sizing, relief load calculations, and disposal system design per API standards.

## Capabilities

- Relief scenario identification
- Relief load calculations
- PSV sizing (API 520/521)
- Flare header hydraulics
- Blowdown system design
- Two-phase relief calculations
- Reactive systems relief
- Relief device selection

## Usage Guidelines

### When to Use
- Designing pressure relief systems
- Sizing relief devices
- Analyzing flare headers
- Evaluating relief scenarios

### Prerequisites
- Process conditions defined
- Relief scenarios identified
- Physical properties available
- Design codes specified

### Best Practices
- Consider all credible scenarios
- Use appropriate methods for two-phase
- Account for backpressure
- Document all assumptions

## Process Integration

This skill integrates with:
- Pressure Relief System Design
- Safety Instrumented System Design
- HAZOP Study Facilitation

## Configuration

```yaml
relief-system-designer:
  design-codes:
    - API-520
    - API-521
    - API-526
  relief-scenarios:
    - fire
    - blocked-outlet
    - control-valve-failure
    - runaway-reaction
```

## Output Artifacts

- Relief calculations
- PSV datasheets
- Flare load summaries
- Header sizing calculations
- Disposal system design
