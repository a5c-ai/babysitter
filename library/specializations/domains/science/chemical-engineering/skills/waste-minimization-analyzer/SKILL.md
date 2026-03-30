---
name: waste-minimization-analyzer
description: Waste minimization analysis skill for source reduction, recycling, and treatment optimization
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
  category: Sustainability
  skill-id: CE-SK-025
---

# Waste Minimization Analyzer Skill

## Purpose

The Waste Minimization Analyzer Skill identifies and evaluates waste minimization opportunities using the waste hierarchy to prioritize source reduction, reuse, and recycling.

## Capabilities

- Waste stream characterization
- Source identification
- Waste hierarchy application
- Source reduction opportunities
- Recycle/reuse evaluation
- Treatment alternatives
- Economic analysis
- Regulatory compliance check
- Pollution prevention planning

## Usage Guidelines

### When to Use
- Developing waste reduction plans
- Evaluating recycling opportunities
- Analyzing treatment alternatives
- Meeting regulatory requirements

### Prerequisites
- Waste inventory available
- Process mass balance complete
- Treatment costs known
- Regulations identified

### Best Practices
- Apply waste hierarchy
- Quantify economic benefits
- Consider life cycle impacts
- Track waste metrics

## Process Integration

This skill integrates with:
- Waste Minimization Analysis
- Process Sustainability Assessment
- Green Chemistry Metrics Evaluation

## Configuration

```yaml
waste-minimization-analyzer:
  hierarchy-levels:
    - source-reduction
    - reuse
    - recycle
    - treatment
    - disposal
  waste-types:
    - hazardous
    - non-hazardous
    - wastewater
    - air-emissions
```

## Output Artifacts

- Waste assessments
- Reduction opportunities
- Economic analyses
- Compliance summaries
- Implementation plans
