---
name: merge-queue
description: Process the Refinery merge queue - collect agent work, detect and resolve conflicts, merge in dependency order, and verify integration.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When multiple agents have worked on overlapping areas
- When integration testing is needed before landing
- When conflict resolution requires coordination

## Process

1. **Collect** pending changes from all agent branches
2. **Detect** conflicts between branches and target
3. **Resolve** conflicts (auto-resolve where possible)
4. **Merge** in dependency order with attribution
5. **Verify** integration (tests, lint, build)

## Conflict Strategies

- **auto**: Attempt automatic resolution, escalate on failure
- **manual**: Always require human review
- **theirs**: Prefer incoming changes
- **ours**: Prefer target branch changes

## Tool Use

Invoke via babysitter process: `methodologies/gastown/gastown-merge-queue`
