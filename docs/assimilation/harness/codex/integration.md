# OpenAI Codex CLI Harness Integration for Babysitter SDK

Source-of-truth guide for integrating babysitter with Codex CLI.

This document intentionally reflects the current implementation and current
known Codex surface area. It replaces older drafts that mixed real Codex
features with Claude-style hook assumptions.

## Summary

Babysitter on Codex is built from four pieces:

- Codex-facing instructions (`AGENTS.md` and installed skills)
- project configuration in `.codex/config.toml`
- an external babysitter supervisor or wrapper that owns orchestration
- optional post-turn monitoring via `notify`

Codex does **not** expose a native blocking `SessionStart` or `Stop` hook for
babysitter. Any design that depends on those hooks is inaccurate.

## Verified Codex Surfaces

Use these surfaces when assimilating or implementing Codex support:

- `AGENTS.md`
- installed skills
- project `.codex/config.toml`
- `notify` after turn completion
- `codex exec`
- optional MCP configuration and multi-agent settings

Do not invent or rely on:

- `.codex/plugin.json` as a native Codex runtime contract
- `[plugin]` or `[hooks]` sections in `config.toml`
- blocking stop hooks
- session-start callbacks
- hidden automatic re-entry after yielding to the user

## Recommended Architecture

### 1. External supervisor owns orchestration

The supervisor or wrapper is responsible for:

- `babysitter session:init`
- `babysitter run:create`
- explicit Codex session binding when a stable session ID is available
- `babysitter run:iterate`
- breakpoint collection and approval handling
- `babysitter task:post`
- resuming after the user turn

### 2. Codex acts as the coding agent

Codex should:

- read the active instructions and skills
- execute the requested coding work
- cooperate with the supervisor contract
- optionally emit post-turn telemetry through `notify`

### 3. Notify is monitoring only

`notify` can be used to:

- log turn completion
- correlate a thread/session ID when available
- detect that a turn finished

`notify` cannot:

- block Codex from ending the turn
- inject the next orchestration step back into the same turn
- replace the supervisor-owned continuation loop

## Session Binding

When the supervisor has a stable Codex session/thread ID, prefer binding at run
creation time:

```bash
babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <file> \
  --prompt "<prompt>" \
  --harness codex \
  --session-id <codex-session-id> \
  --state-dir .a5c \
  --json
```

If the session ID is not available, create the run without harness binding and
let the supervisor own resume behavior explicitly.

`session:associate` is a compatibility fallback for older SDK flows, not the
preferred Codex contract.

## Minimal `.codex/config.toml`

Use real Codex keys only:

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
project_doc_max_bytes = 65536
notify = ["node", ".codex/hooks/on-turn-complete.js"]

[sandbox_workspace_write]
writable_roots = [".a5c", ".codex"]

[features]
multi_agent = true

[agents]
max_depth = 3
max_threads = 4
```

Only add MCP configuration if the chosen Codex workflow actually needs it.

## AGENTS Guidance

Keep Codex AGENTS instructions short and truthful. They should explain:

- where `.a5c` run state lives
- how Codex should cooperate with the babysitter supervisor
- how results are posted with `task:post`
- how explicit resume/yield behavior works

They should not claim:

- automatic slash command registration
- hidden hook-driven continuation
- native session-start or stop-hook orchestration

## User Experience Target

To make Codex feel as close as possible to the Claude Code harness:

- use natural-language activation such as `babysitter call ...`
- install real skills so Codex has the correct workflow guidance
- keep the orchestration loop deterministic in the supervisor
- preserve `.a5c` state, run traces, and resume flows
- surface breakpoints through chat or supervisor UX, not fictional Codex hooks

The similarity should be in operator experience and correctness, not in
pretending Codex has Claude’s hidden integration points.

## Validation Checklist

- `codex --version` works
- `codex exec --help` works
- `.codex/config.toml` uses real Codex keys
- `.a5c` is writable in the configured sandbox
- `run:create --harness codex --session-id ...` works when a session ID exists
- wrapper/supervisor can iterate a run end to end
- yielding to the user and resuming keeps the run in the supervisor loop
- `notify` logs turn completion without being treated as a control hook
- no docs or skills claim native Codex stop/session-start hooks

## Current Limits

- No native blocking stop hook
- No guaranteed interactive breakpoint questionnaire support inside `codex exec`
- No built-in mechanism for Codex to keep itself in the babysitter loop after
  yielding to the user

These limits are why the supervisor remains mandatory for robust Codex
integration.
