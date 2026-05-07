---
name: hypothesis-generator
description: Automated hypothesis generation using abductive reasoning and knowledge graph traversal
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

# Hypothesis Generator

## Purpose

Provides automated hypothesis generation capabilities using abductive reasoning, analogy detection, and knowledge graph traversal.

## Capabilities

- Pattern-based hypothesis generation
- Cross-domain analogy detection
- Contradiction identification
- Hypothesis ranking by novelty/parsimony
- Null hypothesis formulation
- Falsifiability assessment

## Usage Guidelines

1. **Pattern Recognition**: Identify patterns that suggest hypotheses
2. **Analogy**: Transfer insights from related domains
3. **Falsifiability**: Ensure hypotheses are testable
4. **Ranking**: Prioritize hypotheses by potential impact

## Tools/Libraries

- Knowledge graphs
- LLM chains
- Symbolic reasoners
