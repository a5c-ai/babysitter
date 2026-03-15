---
name: maintenance-orchestration
description: Technical debt management including branch cleanup, doc verification, TODO scanning, and dependency auditing
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---
# Maintenance Orchestration

## Capabilities

Orchestrates comprehensive technical debt management. Performs branch cleanup, knowledge graph synchronization, documentation verification, TODO/FIXME scanning, test coverage analysis, and dependency auditing.

## Tool Use Instructions

- Use **Bash** to run git commands for branch analysis and cleanup
- Use **Grep** to scan for TODO, FIXME, HACK, WORKAROUND markers
- Use **Glob** to find documentation files for verification
- Use **Read** to examine docs and configuration files
- Use **Write** to generate maintenance reports

## Process Integration

- Used in `maestro-maintenance.js` (All maintenance operations)
- Agent: Maintenance Engineer
- Triggered after every N specifications (configurable via `maintenanceFrequency`)
- Focus areas configurable: branches, knowledge, docs, todos, coverage, dependencies
- Generates health score and remediation recommendations
