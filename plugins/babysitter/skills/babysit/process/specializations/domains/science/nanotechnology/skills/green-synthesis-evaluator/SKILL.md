---
name: green-synthesis-evaluator
description: Sustainability assessment skill for evaluating and designing environmentally friendly nanomaterial synthesis routes
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: synthesis-materials
  priority: medium
  phase: 6
  tools-libraries:
    - LCA tools
    - Green chemistry databases
    - Sustainability metrics calculators
---

# Green Synthesis Evaluator

## Purpose

The Green Synthesis Evaluator skill provides comprehensive sustainability assessment for nanomaterial synthesis routes, enabling design of environmentally friendly processes through green chemistry metrics and lifecycle analysis.

## Capabilities

- Green chemistry metrics calculation (E-factor, atom economy)
- Lifecycle assessment integration
- Bio-based precursor database
- Solvent sustainability scoring
- Energy consumption estimation
- Waste minimization strategies

## Usage Guidelines

### Sustainability Assessment

1. **Green Chemistry Metrics**
   - E-factor = mass waste / mass product
   - Atom economy = MW product / MW reactants x 100%
   - Process mass intensity (PMI)

2. **Solvent Selection**
   - Use GSK solvent selection guide
   - Prefer water, ethanol, or bio-solvents
   - Avoid chlorinated and aromatic solvents

3. **Energy Optimization**
   - Minimize reaction temperatures
   - Reduce processing times
   - Consider microwave/ultrasonic assistance

## Process Integration

- Green Synthesis Route Development
- Nanoparticle Synthesis Protocol Development

## Input Schema

```json
{
  "current_synthesis": {
    "precursors": ["string"],
    "solvents": ["string"],
    "temperatures": ["number"],
    "reagent_masses": ["number"]
  },
  "product_mass": "number (g)",
  "product_type": "string"
}
```

## Output Schema

```json
{
  "sustainability_metrics": {
    "e_factor": "number",
    "atom_economy": "number (%)",
    "pmi": "number"
  },
  "solvent_score": "number (1-10)",
  "green_alternatives": [{
    "change": "string",
    "improvement": "string",
    "feasibility": "high|medium|low"
  }],
  "overall_rating": "string"
}
```
