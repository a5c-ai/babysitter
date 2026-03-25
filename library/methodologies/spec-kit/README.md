# Spec Kit Methodology

**Source**: [github/spec-kit](https://github.com/github/spec-kit) by GitHub
**Category**: Spec-Driven Development / Progressive Refinement
**License**: See upstream repository

## Overview

Spec Kit implements Spec-Driven Development, where specifications define **what** before **how**, with multi-step refinement rather than one-shot generation. The pipeline progressively refines intent into code: constitution -> specification -> plan -> tasks -> implementation, with quality gates and cross-artifact consistency analysis at each transition.

## Core Principles

- **Specifications as first-class dev artifacts**: Specs are not throwaway documents; they govern the entire pipeline
- **Progressive refinement**: Intent -> spec -> plan -> tasks -> code, each stage adding precision
- **Technology independence**: Works across any tech stack, framework, or language
- **Multi-mode support**: Greenfield (0-to-1), brownfield (iterative enhancement), and creative exploration
- **Quality-gated convergence**: Checklist validation with remediation loops before completion
- **Human approval gates**: Explicit approval between every major phase transition

## Process Files

| Process | File | Description | Task Count |
|---------|------|-------------|------------|
| Orchestrator | `spec-kit-orchestrator.js` | Full pipeline: constitution -> specify -> plan -> tasks -> implement | 8 |
| Specification | `spec-kit-specification.js` | Constitution + specification + clarification workflow | 7 |
| Planning | `spec-kit-planning.js` | Planning + task breakdown + analysis | 7 |
| Implementation | `spec-kit-implementation.js` | Implementation + quality validation + checklist | 7 |

## Skills Catalog

| Skill | Directory | Description |
|-------|-----------|-------------|
| constitution-creation | `skills/constitution-creation/` | Establish project governing principles |
| specification-writing | `skills/specification-writing/` | Write requirements and user stories |
| planning-design | `skills/planning-design/` | Technical architecture and strategy design |
| task-decomposition | `skills/task-decomposition/` | Convert plans into actionable dev tasks |
| implementation-execution | `skills/implementation-execution/` | Execute tasks to build features |
| cross-artifact-analysis | `skills/cross-artifact-analysis/` | Consistency and coverage assessment |
| quality-checklist | `skills/quality-checklist/` | Custom quality validation checklists |

## Agents Catalog

| Agent | Directory | Role |
|-------|-----------|------|
| constitution-architect | `agents/constitution-architect/` | Governing Principles Architect |
| specification-writer | `agents/specification-writer/` | Requirements & User Stories Writer |
| technical-planner | `agents/technical-planner/` | Architecture & Tech Stack Designer |
| task-analyst | `agents/task-analyst/` | Task Decomposition Analyst |
| implementation-engineer | `agents/implementation-engineer/` | Code Generation Engineer |
| consistency-analyzer | `agents/consistency-analyzer/` | Cross-Artifact Consistency Analyzer |
| quality-auditor | `agents/quality-auditor/` | Checklist Validation Auditor |

## Workflow Lifecycle

```
Constitution -> Specification -> [Clarification] -> Planning -> Task Breakdown -> Analysis -> Implementation -> Checklist
     |                |                                 |              |                           |               |
  (review)        (review)                          (review)       (review)                    (review)       (remediation loop)
```

Quality gates applied throughout:
- `cross-artifact-analysis` - Consistency and coverage checked before implementation
- `quality-checklist` - Custom validation with convergence loop after implementation
- Human approval at every phase boundary

## Development Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Greenfield | Full pipeline from scratch (0-to-1) | New projects, new features |
| Brownfield | Iterative enhancement with existing codebase | Enhancements, refactors |
| Creative | Exploratory specification with flexible constraints | Prototypes, experiments |

## Output Artifacts

- `speckit.constitution` - Project governing principles
- `speckit.specification` - Feature requirements and user stories
- `speckit.plan` - Technical architecture and implementation strategy
- `speckit.tasks` - Actionable development task list
- `speckit.analysis` - Cross-artifact consistency report
- `speckit.checklist` - Quality validation results

## Philosophy

- **Define what before how** - Specifications precede implementation
- **Refine progressively** - Each phase adds precision to the previous
- **Validate continuously** - Cross-artifact analysis ensures consistency
- **Scale to any stack** - Technology-independent methodology
- **Preserve human judgment** - Quality gates are approval points, not blockers
