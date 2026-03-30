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
