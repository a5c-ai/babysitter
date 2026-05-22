# @a5c-ai/agent-mux-cli

## 0.4.0

### Patch Changes

- Updated dependencies [ee83281]
  - @a5c-ai/agent-mux-adapters@0.4.0
  - @a5c-ai/agent-mux-core@0.4.0

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

### Patch Changes

- Updated dependencies
  - @a5c-ai/agent-mux-core@0.3.0
  - @a5c-ai/agent-mux-adapters@0.3.0

## 0.2.0

### Minor Changes

- 71ed1eb: Add built-in adapter for Alibaba's Qwen Code CLI (`qwen`). Supports the
  OpenAI-compatible DashScope auth path via `OPENAI_API_KEY`, two Qwen3-Coder
  models (`qwen3-coder-plus`, `qwen3-coder-flash`), and MCP plugin management
  via `~/.qwen/settings.json`. Capabilities are set conservatively — thinking,
  JSON mode, and image input default to `false` pending upstream confirmation.

### Patch Changes

- 71ed1eb: Fix adapter spawn bugs surfaced by reference parity research:

  - **cursor**: `cliCommand` was `"cursor"` but the real binary is `"cursor-agent"` — fixed, cursor runs now actually exec the installed CLI.
  - **claude**: default `--output-format` was `jsonl` but real Claude Code emits incremental content blocks only under `stream-json`. Now defaults to `stream-json` and always passes `--verbose --include-partial-messages` so streaming events aren't swallowed.
  - **claude**: session resume uses `--resume <id>` by default; `--session-id` is now only emitted when `forkSessionId` is set (new session from a fork). Avoids "session already in use" on reconnect.
  - **claude**: `parseEvent` now handles stream-json `stream_event` envelopes — `content_block_delta` `text_delta` → `text_delta`; `input_json_delta` → `tool_input_delta`; `thinking_delta` → `thinking_delta`; `message_stop` → `message_stop`. Previously all silently dropped.
  - **claude**: `authFiles` now lists `~/.claude.json` (the real availability signal) alongside `.claude/settings.json`.

- Updated dependencies [71ed1eb]
- Updated dependencies
- Updated dependencies [5e58f2a]
- Updated dependencies [71ed1eb]
  - @a5c-ai/agent-mux-adapters@0.2.0
  - @a5c-ai/agent-mux-core@0.2.0
