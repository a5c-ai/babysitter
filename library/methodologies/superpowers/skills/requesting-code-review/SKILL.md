---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements.
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- After completing major features
- Before merge to main

## Process

1. Get git SHAs (base and head)
2. Dispatch code-reviewer agent with context
3. Act on feedback (Critical: fix immediately, Important: fix before proceeding, Minor: note for later)

## Agents Used

- `agents/code-reviewer/` - Senior code review agent

## Tool Use

Referenced by `subagent-driven-development` and `executing-plans` processes.
