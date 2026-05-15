---
name: spec-guard
description: Prevents premature completion of incomplete specs. Blocks stopping if spec tasks remain PENDING or acceptance criteria are unmet.
category: enforcement
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:ai-agents-conversational]
  skillAreas: [skill-area:agentic-loops, skill-area:prompt-engineering, skill-area:multi-agent-coordination]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:backend-engineer, role:platform-engineer, role:tech-lead]
**Experience**: Expert in tracking task completion states
**Philosophy**: "No spec is done until every task is VERIFIED"

---

## Task State Model

Tasks progress through: `PENDING` -> `COMPLETE` -> `VERIFIED`

- **PENDING**: Not yet implemented
- **COMPLETE**: Implemented but not yet verified
- **VERIFIED**: Implementation verified against acceptance criteria

## Capabilities

### 1. Completion Checking
- Track each spec task status against its acceptance criteria
- Verify all tasks have progressed to at least COMPLETE
- Block process completion if any task is PENDING
- Report per-task status

### 2. Stop Guard
- Intercept stop/completion signals
- Check spec completeness before allowing stop
- Report specific blockers preventing completion

## Output Format

```json
{
  "complete": false,
  "taskStatuses": [
    { "taskId": "task-1", "status": "VERIFIED", "criteriaMet": true },
    { "taskId": "task-2", "status": "PENDING", "criteriaMet": false }
  ],
  "blockers": ["task-2 is still PENDING"]
}
```
