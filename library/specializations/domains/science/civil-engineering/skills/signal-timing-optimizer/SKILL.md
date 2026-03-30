---
name: signal-timing-optimizer
description: Traffic signal timing optimization skill for cycle length, phasing, and coordination
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
  category: Transportation Analysis
  skill-id: CIV-SK-021
---

# Signal Timing Optimizer Skill

## Purpose

The Signal Timing Optimizer Skill optimizes traffic signal timing including cycle length, phase timing, coordination, and pedestrian timing per MUTCD requirements.

## Capabilities

- Cycle length optimization
- Phase timing calculation
- Coordination timing (green wave)
- Actuated signal design
- Pedestrian timing (ADA compliance)
- MUTCD compliance checking
- Clearance interval calculation
- Ring and barrier diagrams

## Usage Guidelines

### When to Use
- Designing new signals
- Optimizing existing timing
- Coordinating signal systems
- Evaluating pedestrian access

### Prerequisites
- Traffic volumes available
- Intersection geometry defined
- Phasing established
- Speed limits known

### Best Practices
- Verify clearance intervals
- Consider pedestrian needs
- Test coordination plans
- Document design decisions

## Process Integration

This skill integrates with:
- Intersection Signal Design
- Traffic Impact Analysis

## Configuration

```yaml
signal-timing-optimizer:
  optimization-types:
    - cycle-length
    - splits
    - offsets
    - coordination
  standards:
    - MUTCD
    - state-DOT
  modes:
    - pretimed
    - actuated
    - adaptive
```

## Output Artifacts

- Timing plans
- Ring diagrams
- Time-space diagrams
- Compliance checklists
