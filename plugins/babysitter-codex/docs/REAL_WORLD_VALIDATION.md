# Real-World Validation

Controlled tests are necessary but not sufficient. Use this checklist before release.

## Scenarios
1. Long-running refactor task (60+ minutes).
2. Interruption + resume flow (`recent`, alias, tag).
3. Mixed breakpoint policies (interactive + auto-approve).
4. Budget-constrained execution with prompt shrinking.
5. Multi-repo run with explicit repo aliases.
6. MCP doctor diagnostics path (`babysitter:doctor mcp`).
7. Yield to the user, then resume through the Babysitter SDK run/task loop without losing the active run.

## Required Artifacts
- `.a5c/events/events.jsonl`
- `.a5c/logs/hooks.jsonl`
- `.a5c/runs/<runId>/run-trace.jsonl`
- `.a5c/runs/<runId>/state/telemetry.json`

## Pass Criteria
- No unhandled runtime or notify-handler crashes.
- Breakpoints produce resolvable `approved/answers/response` payloads.
- Resume selectors resolve deterministically.
- Budget enforcement behaves as configured.
- Multi-repo tasks execute in the intended working directory.
- `notify` is used for observability only and is not required for run continuation.
