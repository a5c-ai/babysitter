---
name: systematic-debugging
description: Structured debugging methodology using hypothesis-driven investigation, log analysis, and bisection to isolate and resolve defects.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Unexpected behavior discovered during testing
- Bug reports require investigation
- Performance issues need root cause analysis

## Process

1. **Reproduce** - Confirm the defect with a minimal reproduction
2. **Hypothesize** - Form theories about the root cause
3. **Investigate** - Systematically test hypotheses (logs, breakpoints, bisection)
4. **Isolate** - Narrow to the specific component/line
5. **Fix** - Apply targeted fix addressing root cause
6. **Verify** - Confirm fix resolves the issue without regression

## Key Rules

- Never apply fixes without understanding the root cause
- For Strike-3/post-instrumentation handoffs, do not apply a source-code fix
  until you enumerate at least 3 candidate root-cause hypotheses, give each
  hypothesis a falsifying log line or observation, and cite concrete log
  evidence for the selected fix. Use seq number when present; otherwise cite
  timestamp, log-id, or artifact path plus the exact log line. If no proposed
  fix cites a specific log line or log record, mark `needs-more-data`.
- Use web-researcher agent for unfamiliar error patterns
- Document the investigation path for future reference
- Verify that the fix does not introduce regressions

## Tool Use

Integrated into `methodologies/rpikit/rpikit-implement` (failure handling)
