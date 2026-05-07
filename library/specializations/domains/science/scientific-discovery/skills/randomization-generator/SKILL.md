---
name: randomization-generator
description: Skill for generating randomization schemes for experiments
allowed-tools:
  - Bash
  - Read
  - Write
metadata:
  specialization: scientific-discovery
  domain: science
  category: Experimental Design
  skill-id: SK-SCIDISC-014
graph:
  domains: [domain:scientific-discovery]
  specializations: [specialization:scientific-research-methods]
  skillAreas: [skill-area:data-analysis, skill-area:statistical-analysis, skill-area:deep-web-research]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:research-engineer, role:computational-scientist]
---

# Randomization Generator Skill

## Purpose

Generate randomization schemes for experimental designs including simple, stratified, and adaptive randomization methods.

## Capabilities

- Generate random assignments
- Create stratified randomization
- Implement block randomization
- Support adaptive designs
- Ensure allocation concealment
- Document randomization

## Usage Guidelines

1. Define design requirements
2. Select randomization method
3. Configure parameters
4. Generate assignments
5. Verify balance
6. Document scheme

## Process Integration

Works within scientific discovery workflows for:
- Clinical trial design
- Laboratory experiments
- Field studies
- A/B testing

## Configuration

- Randomization method
- Stratification factors
- Block sizes
- Seed management

## Output Artifacts

- Randomization lists
- Allocation sequences
- Balance checks
- Scheme documentation
