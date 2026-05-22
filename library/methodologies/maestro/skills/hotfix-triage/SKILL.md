---
name: hotfix-triage
description: Urgent issue classification, root cause analysis, and fast-path routing for production hotfixes
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

# Hotfix Triage

## Capabilities

Rapidly classifies production issues by severity, locates root causes from logs and stack traces, and routes to the appropriate fix path. Simple fixes skip planning entirely for maximum speed.

## Tool Use Instructions

- Use **Read** to examine log files and error reports
- Use **Grep** to search for error patterns and stack trace references in code
- Use **Glob** to find affected source files
- Use **Bash** to reproduce issues and check system state
- Use **Write** to generate triage reports

## Process Integration

- Used in `maestro-hotfix.js` (Triage and Root Cause)
- Agent: Hotfix Specialist
- Severity levels: critical (immediate), high (same-day), medium (next-sprint)
- Simple fixes skip planning phase
- High-risk fixes require human approval breakpoint
