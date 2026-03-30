---
name: scale-up-analyzer
description: Process scale-up analysis skill for dimensional analysis, similarity criteria, and pilot-to-production transitions
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
  category: Process Development
  skill-id: CE-SK-009
---

# Scale-Up Analyzer Skill

## Purpose

The Scale-Up Analyzer Skill supports process scale-up from laboratory to pilot to production scale using dimensional analysis, similarity criteria, and scale-up correlations.

## Capabilities

- Dimensional analysis
- Similarity criteria evaluation
- Scale-up factor calculation
- Heat transfer scale-up
- Mass transfer scale-up
- Mixing scale-up (power per volume, tip speed)
- Reaction scale-up considerations
- Risk assessment for scale-up

## Usage Guidelines

### When to Use
- Scaling from lab to pilot
- Scaling from pilot to production
- Evaluating scale-up feasibility
- Identifying scale-sensitive parameters

### Prerequisites
- Lab/pilot data available
- Process fundamentals understood
- Critical parameters identified
- Target scale defined

### Best Practices
- Identify controlling mechanisms
- Maintain appropriate similarity criteria
- Plan incremental scale-up steps
- Validate at each scale

## Process Integration

This skill integrates with:
- Scale-Up Analysis
- Process Simulation Model Development
- Performance Testing and Validation

## Configuration

```yaml
scale-up-analyzer:
  scale-up-methods:
    - geometric-similarity
    - dynamic-similarity
    - thermal-similarity
  scale-factors:
    - 10x
    - 100x
    - 1000x
```

## Output Artifacts

- Scale-up calculations
- Similarity analysis
- Risk assessments
- Scale-up recommendations
- Parameter predictions
