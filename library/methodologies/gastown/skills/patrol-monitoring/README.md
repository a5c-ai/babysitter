# Patrol Monitoring Skill

Deacon/Witness monitoring adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Purpose

Continuous health monitoring with automated recovery for multi-agent workflows.

## Process Flow

1. Run health checks
2. Detect stuck agents
3. Execute recovery actions
4. Generate patrol report

## Integration

- **Input from:** Active convoy execution
- **Output to:** Recovery actions, patrol reports
- **Process file:** `../../gastown-patrol.js`
