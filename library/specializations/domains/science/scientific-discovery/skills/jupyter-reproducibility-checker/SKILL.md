---
name: jupyter-reproducibility-checker
description: Skill for checking and ensuring Jupyter notebook reproducibility
allowed-tools:
  - Bash
  - Read
  - Write
metadata:
  specialization: scientific-discovery
  domain: science
  category: Reproducibility
  skill-id: SK-SCIDISC-024
graph:
  domains: [domain:scientific-discovery]
  specializations: [specialization:scientific-research-methods]
  skillAreas: [skill-area:data-analysis, skill-area:statistical-analysis, skill-area:deep-web-research]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:research-engineer, role:computational-scientist]
---

# Jupyter Reproducibility Checker Skill

## Purpose

Check and ensure reproducibility of Jupyter notebooks including cell execution order, environment dependencies, and output consistency.

## Capabilities

- Verify execution order
- Check dependencies
- Test reproducibility
- Clear and rerun notebooks
- Document environments
- Generate requirements

## Usage Guidelines

1. Load notebook
2. Check execution order
3. Identify dependencies
4. Test fresh execution
5. Document environment
6. Generate reports

## Process Integration

Works within scientific discovery workflows for:
- Reproducibility audits
- Notebook cleanup
- Environment documentation
- Quality assurance

## Configuration

- Check criteria
- Execution settings
- Environment capture
- Report formatting

## Output Artifacts

- Reproducibility reports
- Dependency lists
- Environment files
- Cleaned notebooks
