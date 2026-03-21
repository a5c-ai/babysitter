# Babysitter-Codex Maintainer Notes

This package targets real Codex customization surfaces:

- `AGENTS.md` guidance
- installed skills under `~/.codex/skills/...`
- project `.codex/config.toml`
- optional `notify` monitoring

It does **not** rely on fictional Codex lifecycle hooks or native custom slash
command registration.

## Product Contract

- The Babysitter SDK run/task loop owns orchestration and `.a5c` state.
- Codex participates through skills, instructions, `config.toml`, and optional
  `notify` telemetry.
- If a stable Codex session/thread ID is available, pass it explicitly to
  `babysitter run:create --harness codex --session-id <id> --state-dir .a5c`.
- Never fabricate a session ID just to satisfy `session:init`.
- Compatibility shell hooks may exist in the package, but they are stubs only.

## UX Goals

- User-facing activation should work with normal language such as
  `babysitter call ...` or explicit skill selection.
- Optional `/babysitter:*` aliases may be shipped only as compatibility sugar;
  do not describe them as a native Codex feature.
- Keep the runtime contract honest. If a feature is runtime-only, document it
  that way.

## Documentation Rules

- Do not claim Codex fires `SessionStart` or `Stop` hooks.
- Do not say the agent stays in the orchestration loop because a stop hook
  re-invokes it.
- Describe `notify` as post-turn monitoring only.
- Keep version numbers, supported Node/Codex versions, and feature status
  consistent across README, docs, tests, and package metadata.
