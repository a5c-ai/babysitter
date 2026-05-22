---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session. Dispatches fresh subagent per task.
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Want to stay in current session
- Want automatic review checkpoints

## Two-Stage Review

1. **Spec Compliance** - Did they build what was requested? (nothing more, nothing less)
2. **Code Quality** - Is it well-built? (clean, tested, maintainable)

Spec MUST pass before quality review begins.

## Red Flags

- Never skip either review stage
- Never proceed with unfixed issues
- Never dispatch multiple implementation subagents in parallel
- Never let implementer self-review replace actual review

## Agents Used

- `agents/implementer/` - Fresh subagent per task
- `agents/spec-reviewer/` - Verifies spec compliance
- `agents/code-quality-reviewer/` - Verifies code quality
- `agents/code-reviewer/` - Final review of entire implementation

## Tool Use

Invoke via babysitter process: `methodologies/superpowers/subagent-driven-development`
