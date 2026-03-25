---
name: experiment-planner-doe
description: Design of Experiments skill for systematic optimization of nanomaterial synthesis and processing
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: infrastructure-quality
  priority: high
  phase: 6
  tools-libraries:
    - JMP
    - Design-Expert
    - Minitab
    - scipy.stats
---

# Experiment Planner DOE

## Purpose

The Experiment Planner DOE skill provides systematic experimental design for nanomaterial synthesis and processing optimization, enabling efficient exploration of parameter space and robust process development.

## Capabilities

- Factorial design generation
- Response surface methodology
- Taguchi method implementation
- ANOVA analysis
- Optimization predictions
- Robustness testing

## Usage Guidelines

### DOE Workflow

1. **Design Selection**
   - Identify factors and levels
   - Choose appropriate design
   - Calculate required runs

2. **Execution Planning**
   - Randomize run order
   - Include replicates
   - Plan blocking if needed

3. **Analysis**
   - Perform ANOVA
   - Build response models
   - Optimize parameters

## Process Integration

- Nanoparticle Synthesis Protocol Development
- Thin Film Deposition Process Optimization
- Nanolithography Process Development

## Input Schema

```json
{
  "factors": [{
    "name": "string",
    "low": "number",
    "high": "number",
    "type": "continuous|categorical"
  }],
  "responses": ["string"],
  "design_type": "factorial|fractional|rsm|taguchi",
  "constraints": {
    "max_runs": "number",
    "blocking": "boolean"
  }
}
```

## Output Schema

```json
{
  "design": {
    "type": "string",
    "runs": "number",
    "run_table": [{
      "run": "number",
      "factors": {},
      "block": "number"
    }]
  },
  "analysis": {
    "anova_table": {},
    "significant_factors": ["string"],
    "r_squared": "number"
  },
  "optimization": {
    "optimal_settings": {},
    "predicted_response": "number",
    "confidence_interval": {"lower": "number", "upper": "number"}
  }
}
```
