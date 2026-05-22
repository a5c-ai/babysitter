# @a5c-ai/agent-mux-tui

## Unreleased

### Documentation

- Add planning artifacts for proposed `kanban` and `workspaces` TUI views,
  including spec, backlog decomposition, design note, and package publish-surface
  metadata updates for `specs/`.

### Tooling

- Add package-local release verification for `@a5c-ai/agent-mux-tui` so README-linked
  kanban/workspaces specs stay in the packed tarball and CI/release workflows
  exercise that contract explicitly.

## 0.4.1

### Patch Changes

- @a5c-ai/agent-mux@0.4.0

## 0.4.0

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
  - @a5c-ai/agent-mux@0.3.0

## 0.3.0

### Minor Changes

- 5f75204: New package: Ink-based TUI scaffold with plugin-first architecture. Ships built-in plugins for `text_delta`/`thinking_delta`, tool-call rendering, cost, chat view, and sessions list. Host provides only the Ink process, view router, and SDK-injected `TuiContext`; renderers, views, and commands all register through the same plugin API (`definePlugin`, `registerView`, `registerEventRenderer`, `registerCommand`).
