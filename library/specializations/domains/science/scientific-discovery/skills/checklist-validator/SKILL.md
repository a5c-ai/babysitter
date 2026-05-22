---
name: checklist-validator
description: Skill for validating research against reporting checklists
allowed-tools:
  - Read
  - Write
  - Bash
metadata:
  specialization: scientific-discovery
  domain: science
  category: Quality Assurance
  skill-id: SK-SCIDISC-030
graph:
  domains: [domain:scientific-discovery]
  specializations: [specialization:scientific-research-methods]
  skillAreas: [skill-area:data-analysis, skill-area:statistical-analysis, skill-area:deep-web-research]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:research-engineer, role:computational-scientist]
---

# Checklist Validator Skill

## Purpose

Validate research manuscripts against reporting checklists such as CONSORT, PRISMA, STROBE, and other guidelines.

## Capabilities

- Apply reporting checklists
- Identify missing elements
- Suggest improvements
- Track compliance
- Generate reports
- Support multiple guidelines

## Usage Guidelines

1. Select checklist type
2. Load manuscript
3. Assess each item
4. Identify gaps
5. Generate report
6. Track completion

## Process Integration

Works within scientific discovery workflows for:
- Manuscript review
- Submission preparation
- Quality assurance
- Compliance checking

## Configuration

- Checklist library
- Assessment criteria
- Report templates
- Tracking options

## Output Artifacts

- Compliance reports
- Gap analyses
- Checklist completions
- Improvement suggestions
