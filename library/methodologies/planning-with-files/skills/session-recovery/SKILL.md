---
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

# Session Recovery

Detect and recover previous planning sessions, reconstructing lost context from persistent planning files.

## Agent
Session Manager - `pwf-session-manager`

## Workflow
1. Check project path for existing planning files
2. Check ~/.claude/projects/ for session data
3. Find last planning file update timestamp
4. Extract post-update conversation context (lost context)
5. Build catchup report summarizing accomplished work
6. Merge recovered state into current session

## Inputs
- `projectPath` - Root path for planning files
- `sessionId` - Session identifier for recovery
- `previousSessionPath` - Path to previous session (optional)

## Outputs
- Recovery report with completed phases and lost context estimate
- Merged session state with preserved checkboxes
- Catchup summary for manual sync

## Process Files
- `planning-orchestrator.js` - Session recovery at startup
- `planning-session.js` - Full recovery pipeline
