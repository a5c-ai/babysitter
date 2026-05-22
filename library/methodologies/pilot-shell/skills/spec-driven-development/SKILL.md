---
name: spec-driven-development
description: Specification creation and management for the Pilot Shell methodology. Covers semantic search, clarifying questions, structured spec generation, and iterative refinement.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-core
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

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
