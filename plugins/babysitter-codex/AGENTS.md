# Babysitter-Codex Maintainer Notes

This package targets real Codex customization surfaces:

- `AGENTS.md` guidance
- installed skills under `~/.codex/skills/...`
- project `.codex/config.toml`
- workspace `.codex/hooks.json`

It does **not** rely on fictional manifest plugins or native custom slash
command registration.

## Product Contract

- The Babysitter SDK run/task loop owns orchestration and `.a5c` state.
- Codex participates through skills, instructions, `config.toml`, and real
  lifecycle hooks registered in `.codex/hooks.json`.
- If a stable Codex session/thread ID is available, pass it explicitly to
  `babysitter run:create --harness codex --session-id <id> --state-dir .a5c`.
- Never fabricate a session ID just to satisfy `session:init`.
- The `Stop` hook is the continuation owner for the plugin path.

## UX Goals

- User-facing activation should work with normal language such as
  `babysitter call ...` or explicit skill selection.
- Optional `/babysitter:*` aliases may be shipped only as compatibility sugar;
  do not describe them as a native Codex feature.
- Keep the runtime contract honest. If a feature is runtime-only, document it
  that way.

## Documentation Rules

- Do not describe an external supervisor or turn-controller as the primary
  plugin runtime model.
- Do say that `SessionStart`, `UserPromptSubmit`, and `Stop` are the active
  Codex lifecycle hooks when onboarding has installed `.codex/hooks.json`.
- Describe `notify` as optional post-turn monitoring only.
- Keep version numbers, supported Node/Codex versions, and feature status
  consistent across README, docs, tests, and package metadata.
