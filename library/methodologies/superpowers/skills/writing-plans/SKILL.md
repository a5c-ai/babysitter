---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Creates bite-sized TDD implementation plans with dependency tracking.
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When you have specs/requirements for multi-step work
- Before any implementation begins

## Task Structure

Each task follows: Write failing test -> Verify fail -> Implement minimal code -> Verify pass -> Commit

## Plan Format

- Header: Goal, Architecture, Tech Stack
- Tasks with exact file paths and complete code
- TDD steps with expected output
- Task persistence via `.tasks.json`

## Execution Handoff

After plan is written, choose:
1. **Subagent-Driven** - Fresh agent per task with two-stage review
2. **Batch Execution** - Execute in batches with human checkpoints

## Agents Used

- Process agents defined in `writing-plans.js`

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/writing-plans`
