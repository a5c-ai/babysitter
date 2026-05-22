---
name: pr-shepherding
description: Monitor PR lifecycle from creation through merge including CI monitoring, review comment handling, thread resolution, and merge readiness verification.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When a PR needs CI monitoring
- When review comments need automated handling

## Process

1. **Monitor CI** - Watch pipeline status, triage failures
2. **Handle Comments** - Respond to review feedback, make code changes
3. **Resolve Threads** - Close addressed review threads
4. **Verify Readiness** - Check approvals, CI green, threads resolved, coverage met

## Merge Readiness Checklist (gtg)

- [ ] All CI checks passing
- [ ] Required approvals obtained
- [ ] All review threads resolved
- [ ] Coverage thresholds met
- [ ] No merge conflicts
- [ ] SERVICE-INVENTORY.md updated

## Agents Used

- `agents/pr-shepherd/` - PR lifecycle management

## Tool Use

Invoke via babysitter process: `methodologies/metaswarm/metaswarm-pr-shepherd`
