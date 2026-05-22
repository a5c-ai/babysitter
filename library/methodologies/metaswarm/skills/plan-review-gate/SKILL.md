---
name: plan-review-gate
description: Adversarial plan review by 3 independent reviewers (Feasibility, Completeness, Scope & Alignment) before presenting to user.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Before presenting a plan for user approval
- When validating work unit decomposition quality

## Process

1. **Feasibility Reviewer** - Can this plan actually be implemented? Technical viability, resource requirements, timeline reality
2. **Completeness Reviewer** - Does the plan cover everything? Missing edge cases, untested paths, incomplete DoD items
3. **Scope & Alignment Reviewer** - Does the plan match the issue? Scope creep detection, requirement traceability

All 3 must PASS before the plan is presented.

## Key Rules

- Reviewers operate independently (no shared context)
- Each provides a binary PASS/FAIL verdict
- Findings include specific references to plan sections
- Failed plans require revision before re-review

## Tool Use

Invoke as part of: `methodologies/metaswarm/metaswarm-orchestrator` (Phase 1b)
