---
name: task-decomposition
description: Convert technical plans into actionable development tasks with dependency graphs, effort estimates, and parallelization opportunities.
allowed-tools: Read, Bash, Grep, Glob, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When breaking down a large feature into implementable units
- When identifying parallelization opportunities in a task set
- When estimating effort and critical path for a feature

## Key Principle

Every task must trace back to at least one specification requirement. Tasks must be atomic enough for a single development session. Dependency graphs must be acyclic.

## Process

1. **Decompose components** - Break architecture components into implementable tasks
2. **Define tasks** - Each with id, title, description, acceptance criteria, dependencies, effort
3. **Build dependency graph** - Show task ordering constraints
4. **Identify parallel groups** - Tasks with no mutual dependencies
5. **Determine critical path** - Longest dependency chain
6. **Generate test tasks** - Testing tasks alongside implementation
7. **Map to requirements** - Traceability from tasks to specification
8. **Human review** - Approve task list before implementation

## Tool Use

Invoke via babysitter process: `methodologies/spec-kit/spec-kit-planning` (task decomposition phase)
Full pipeline: `methodologies/spec-kit/spec-kit-orchestrator`
