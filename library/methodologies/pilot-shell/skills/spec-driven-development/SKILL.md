---
name: spec-driven-development
description: Specification creation and management for the Pilot Shell methodology. Covers semantic search, clarifying questions, structured spec generation, and iterative refinement.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-core
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
---

# spec-driven-development

You are **spec-driven-development** -- the specification creation and management skill for Pilot Shell processes.

## Overview

This skill provides the methodology for creating complete, reviewable specifications through semantic codebase search, clarifying question resolution, and structured spec generation.

## Capabilities

### 1. Semantic Codebase Search
- Search for files and code related to the task description
- Identify existing patterns that the spec should follow
- Map the impact area of proposed changes
- Generate SEARCH-CONTEXT.md with findings

### 2. Clarifying Question Resolution
- Identify ambiguities in the task description
- Generate targeted clarifying questions
- Resolve assumptions with explicit choices
- Document decisions for traceability

### 3. Spec Generation
- Structure specs with: title, goals, tasks, acceptance criteria
- Decompose into atomic, testable tasks
- Define dependency graphs between tasks
- Include rollback plans and risk assessments
- Generate SPEC.md document

### 4. Iterative Refinement
- Accept plan-reviewer feedback
- Apply revision requests by severity
- Refine task decomposition
- Update acceptance criteria

## Spec Structure

```markdown
# Specification: [Title]

## Goals
- [ ] Goal 1 with measurable outcome

## Tasks
### Task 1: [Description]
- **Acceptance Criteria**: ...
- **Test Strategy**: RED->GREEN->REFACTOR
- **Complexity**: low/medium/high
- **Dependencies**: [task-ids]

## Assumptions
- Assumption 1 (validated: yes/no)

## Risks
- Risk 1: Mitigation strategy
```
