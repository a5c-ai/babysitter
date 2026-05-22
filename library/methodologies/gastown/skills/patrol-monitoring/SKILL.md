---
name: patrol-monitoring
description: Continuous monitoring using Deacon/Witness patterns for agent health checks, stuck detection, and automated recovery.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- When agents may become stuck or unresponsive
- For long-running multi-agent workflows
- When automated recovery is desired

## Process

1. **Health check** all active agents and convoys
2. **Detect** stuck or unresponsive agents via heartbeats
3. **Recover** - restart, reassign, or escalate as needed
4. **Report** patrol findings with trend analysis

## Monitoring Roles

- **Deacon**: Daemon supervisor, monitors overall health
- **Witness**: Per-rig lifecycle manager for workers
- **Boot (Dog)**: Watches the Deacon every 5 minutes

## Recovery Modes

- **restart**: Restart the stuck agent session
- **reassign**: Move beads to a different agent
- **escalate**: Alert human for manual intervention

## Tool Use

Invoke via babysitter process: `methodologies/gastown/gastown-patrol`
