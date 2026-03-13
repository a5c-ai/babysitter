---
name: traffic-simulation-engine
description: Traffic simulation skill for microsimulation, level of service, and signal optimization
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
  skill-id: CIV-SK-019
---

# Traffic Simulation Engine Skill

## Purpose

The Traffic Simulation Engine Skill performs traffic analysis including microsimulation, level of service calculation per HCM methodology, and signal timing optimization.

## Capabilities

- Microsimulation modeling
- Level of service calculation (HCM methodology)
- Queue length estimation
- Delay analysis
- Signal timing optimization
- Trip generation calculation
- Capacity analysis
- Intersection performance

## Usage Guidelines

### When to Use
- Analyzing traffic impacts
- Evaluating intersection operations
- Optimizing signal timing
- Projecting future conditions

### Prerequisites
- Traffic count data available
- Network geometry defined
- Signal timing known
- Growth rates established

### Best Practices
- Validate model with counts
- Use appropriate peak periods
- Consider multiple scenarios
- Document assumptions

## Process Integration

This skill integrates with:
- Traffic Impact Analysis
- Intersection Signal Design

## Configuration

```yaml
traffic-simulation-engine:
  analysis-types:
    - intersection
    - corridor
    - network
  methodologies:
    - HCM
    - microsimulation
  metrics:
    - LOS
    - delay
    - queue
    - v/c
```

## Output Artifacts

- LOS summaries
- Delay calculations
- Queue length reports
- Simulation animations
