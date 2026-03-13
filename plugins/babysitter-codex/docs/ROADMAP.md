# Babysitter-Codex Roadmap

This roadmap tracks prioritized feature delivery requested by users across Codex and related AI dev platforms.

## v0.1.5 (implemented in current branch)
- Session UX: aliases/tags + searchable resume selectors.
- Event stream v1 + notifications (`on-turn-complete`, run terminal states).
- Hook lifecycle expansion (`on-tool-error`, `on-policy-block`, `on-retry`).
- Hook reliability and Codex thread/session compatibility hardening.

## v0.2.0 (implemented in current branch)
- Long-task autonomous mode with staged approval policies.
- Plan/Act hardening (immutable plan mode + explicit transition gates).
- Mid-session model routing and per-phase policies.
- Cost/token telemetry and budget guardrails.

## v0.3.0 (implemented in current branch)
- Multi-repo workspace orchestration with alias/scoped execution.
- MCP doctor and auth readiness diagnostics.
- Native GitHub issue workflow (`issue -> plan -> optional apply`).
- Evaluation harness with regression/cost/latency signals.

## Feature Flags
The new runtime capabilities are gated by flags loaded from:
- `.a5c/config/features.json`
- `BABYSITTER_FEATURE_*` environment variables

Default flags are defined in `.codex/feature-flags.js`.
