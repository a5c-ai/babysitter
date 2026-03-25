---
name: babysitter:retrospect
description: Analyze a completed or in-flight run and propose process improvements for future runs.
argument-hint: "[run-id] Optional run ID, defaults to latest run"
---

# babysitter:retrospect

Run a structured retrospective over the last babysitter execution and convert findings into actionable process/library improvements.

## Workflow

1. Resolve target run
- If run ID is provided, use it.
- Otherwise select the latest run under `.a5c/runs`.

2. Collect run evidence
- Read run status/events/task outputs:
```bash
babysitter run:status .a5c/runs/<runId> --json
babysitter task:list .a5c/runs/<runId> --json
```
- Inspect trace and event stream:
  - `.a5c/runs/<runId>/run-trace.jsonl`
  - `.a5c/events/events.jsonl`

3. Analyze against process library
- Resolve the active process library first:
```bash
babysitter process-library:active --state-dir .a5c --json
```
- Compare what was executed vs the active process-library binding and relevant methodologies/specializations.

4. Produce retrospective output
- Include:
  - What worked well
  - What failed or slowed convergence
  - Concrete process modifications (tasks/hooks/policies/budgets/breakpoints)
  - Suggested library contributions (processes/skills/agents/docs)

5. If user approves, apply improvements
- Update process files under `.a5c/processes` and/or codex harness config/docs.
- Suggest contribution flow to upstream Babysitter for generally useful changes.
