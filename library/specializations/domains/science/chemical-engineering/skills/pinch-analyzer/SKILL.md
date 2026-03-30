---
name: pinch-analyzer
description: Heat integration analysis skill using pinch technology for energy targeting and heat exchanger network design
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
  category: Process Simulation
  skill-id: CE-SK-004
---

# Pinch Analyzer Skill

## Purpose

The Pinch Analyzer Skill applies pinch technology for heat integration, energy targeting, and heat exchanger network synthesis to minimize utility consumption.

## Capabilities

- Stream data extraction and processing
- Composite curve generation
- Grand composite curve analysis
- Pinch point determination
- Heat exchanger network synthesis
- Area targeting and cost optimization
- Utility system integration
- Multiple utilities optimization

## Usage Guidelines

### When to Use
- Optimizing process heat integration
- Designing heat exchanger networks
- Targeting utility requirements
- Evaluating retrofit opportunities

### Prerequisites
- Process simulation converged
- Stream data extracted
- Utility specifications defined
- Cost data available

### Best Practices
- Use appropriate minimum approach temperature
- Consider practical constraints
- Evaluate multiple design alternatives
- Account for operability

## Process Integration

This skill integrates with:
- Heat Integration Analysis
- Energy Efficiency Optimization
- Process Flow Diagram Development

## Configuration

```yaml
pinch-analyzer:
  delta-t-min: 10  # degrees
  utilities:
    - steam
    - cooling-water
    - refrigeration
  optimization-objectives:
    - energy
    - capital
    - total-annual-cost
```

## Output Artifacts

- Composite curves
- Grand composite curves
- HEN designs
- Energy targets
- Cost estimates
