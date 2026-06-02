# @a5c-ai/agent-mux-comm

## 0.4.9

### Patch Changes

- Clean up the public surface so plugin contracts are owned by `plugin-types`, auth descriptors are owned by `auth-types`, and `resolveRunOptions` is documented as a stable merge helper instead of a placeholder.

## 0.4.0

## 0.3.0

### Minor Changes

- Adds:

  - **CLI `amux skill`** — file-convention skill management (`list`/`add`/`remove`/`where`/`agents`) with `--global`/`--project` scope. Per-agent path registry covers claude, codex, cursor, opencode, gemini, copilot.
  - **CLI `amux mcp --global`** — explicit scope flag (was project-only).
  - **CLI `amux plugin --json`** — emits `CAPABILITY_ERROR` envelope for unsupported agents; `plugins` aliased to `plugin` for back-compat.
  - **TUI auth-view (`a`)** — per-adapter `client.auth.check` status with method/identity, `R` to refresh.
  - **TUI config-view (`c`)** — agent picker with pretty-JSON `client.config.get` browser.
  - **TUI user-plugin discovery** — loads `~/.amux/tui-plugins/*.{mjs,cjs,js}` (override via `$AMUX_TUI_PLUGINS_DIR` or `--user-plugins-dir`; opt out with `--no-user-plugins`).
  - **Adapters auth-config** — recognizes nested OAuth `tokens.{access,refresh,id}_token`, decodes JWT id_tokens for email/sub, surfaces `hasRefreshToken` and `expiresAt`. Soft-optional keytar via `tryKeychainLookup` (no hard dep). codex/cursor/gemini/opencode adapters report the actual auth method.

## 0.2.0

### Minor Changes

- 5e58f2a: Address research-surfaced leftovers:

  - **core**: new exports `sumCost`, `sumCostAsync`, `filterEvents`,
    `filterEventsAsync`, and `CostSummary` type. Works on both live
    `handle.events()` streams and stored session event arrays. Removes the
    per-call switch/reduce boilerplate.
  - **adapters**: `buildEnvFromOptions` now propagates harness-relevant env
    vars (`CODEX_HOME`, `GH_HOST`, `GH_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS`,
    `HTTPS_PROXY` / `HTTP_PROXY` / `NO_PROXY`) into every spawn. Fixes codex
    runs that need a non-default `CODEX_HOME` and copilot runs against
    GitHub Enterprise via `GH_HOST`. Explicit `RunOptions.env` still wins.
  - **docs**: new capability matrix page (`docs/19-capabilities-matrix.md`)
    and cost-tracking tutorial.

### Patch Changes

- 71ed1eb: Fix adapter spawn bugs surfaced by reference parity research:

  - **cursor**: `cliCommand` was `"cursor"` but the real binary is `"cursor-agent"` — fixed, cursor runs now actually exec the installed CLI.
  - **claude**: default `--output-format` was `jsonl` but real Claude Code emits incremental content blocks only under `stream-json`. Now defaults to `stream-json` and always passes `--verbose --include-partial-messages` so streaming events aren't swallowed.
  - **claude**: session resume uses `--resume <id>` by default; `--session-id` is now only emitted when `forkSessionId` is set (new session from a fork). Avoids "session already in use" on reconnect.
  - **claude**: `parseEvent` now handles stream-json `stream_event` envelopes — `content_block_delta` `text_delta` → `text_delta`; `input_json_delta` → `tool_input_delta`; `thinking_delta` → `thinking_delta`; `message_stop` → `message_stop`. Previously all silently dropped.
  - **claude**: `authFiles` now lists `~/.claude.json` (the real availability signal) alongside `.claude/settings.json`.
