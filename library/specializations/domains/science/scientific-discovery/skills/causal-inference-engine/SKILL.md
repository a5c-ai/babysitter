---
name: causal-inference-engine
description: Causal reasoning implementing DAG construction, do-calculus, and intervention effect estimation
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: scientific-discovery
  domain: science
  category: hypothesis-reasoning
  phase: 6
graph:
  domains: [domain:scientific-discovery]
  specializations: [specialization:scientific-research-methods]
  skillAreas: [skill-area:data-analysis, skill-area:statistical-analysis, skill-area:deep-web-research]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:research-engineer, role:computational-scientist]
---

# Causal Inference Engine

## Purpose

Provides causal reasoning capabilities implementing DAG construction, do-calculus, and intervention effect estimation.

## Capabilities

- Causal DAG construction and validation
- Backdoor/frontdoor criterion checking
- Average treatment effect estimation
- Instrumental variable analysis
- Mediation analysis
- Sensitivity analysis for unmeasured confounding

## Usage Guidelines

1. **DAG Construction**: Build causal graphs from domain knowledge
2. **Identification**: Check if effects are identifiable
3. **Estimation**: Apply appropriate estimation methods
4. **Sensitivity**: Assess robustness to unmeasured confounding

## Tools/Libraries

- DoWhy
- CausalNex
- pgmpy
- EconML
