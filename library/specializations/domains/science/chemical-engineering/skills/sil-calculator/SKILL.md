---
name: sil-calculator
description: Safety Integrity Level calculation skill for SIF design and verification per IEC 61511
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
  skill-id: CE-SK-015
graph:
  domains: [domain:chemical-engineering]
  skillAreas: [skill-area:statistical-analysis, skill-area:mathematical-reasoning, skill-area:compliance-automation]
  workflows: [workflow:experiment-design]
  roles: [role:research-engineer, role:systems-integration-engineer]
---

# SIL Calculator Skill

## Purpose

The SIL Calculator Skill determines Safety Integrity Levels for Safety Instrumented Functions and verifies SIF designs meet required risk reduction per IEC 61511.

## Capabilities

- SIL determination (risk graph, LOPA, risk matrix)
- PFDavg calculations
- Proof test interval optimization
- Common cause failure analysis
- Hardware fault tolerance verification
- Diagnostic coverage assessment
- Systematic capability evaluation
- SIF verification calculations

## Usage Guidelines

### When to Use
- Determining SIL requirements
- Designing safety instrumented functions
- Verifying SIF performance
- Optimizing proof test intervals

### Prerequisites
- HAZOP recommendations available
- Risk criteria defined
- Component failure data available
- Architecture selected

### Best Practices
- Use consistent methodology
- Document all assumptions
- Consider common cause failures
- Verify systematic capability

## Process Integration

This skill integrates with:
- Safety Instrumented System Design
- HAZOP Study Facilitation
- Pressure Relief System Design

## Configuration

```yaml
sil-calculator:
  determination-methods:
    - risk-graph
    - lopa
    - risk-matrix
  failure-databases:
    - OREDA
    - SINTEF
    - exida
```

## Output Artifacts

- SIL determination reports
- PFDavg calculations
- SIF specifications
- Verification reports
- Test interval recommendations
