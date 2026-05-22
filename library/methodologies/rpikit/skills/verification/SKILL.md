---
name: verification
description: Verification-before-completion discipline ensuring all success criteria are met, tests pass, and reviews complete before declaring work done.
allowed-tools: Read, Bash, Grep, Glob, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- At phase checkpoints
- Before final completion declaration
- When validating that all acceptance criteria are met

## Verification Checklist

1. All automated tests pass
2. Manual verification steps confirmed
3. Code review completed (APPROVE or APPROVE_WITH_NITS)
4. Security review passed
5. Plan document updated with completion status
6. All success criteria from the plan are satisfied
7. No untracked deviations from the plan

## Key Rules

- Never declare done without running verification
- Document any verification failures
- Verification failures halt progress until resolved

## Tool Use

Integrated into `methodologies/rpikit/rpikit-implement` (step execution and completion)
