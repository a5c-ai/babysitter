---
id: page:process-gaps-GAP-L1-P0-claude-code-plugin-component-types
nodeKind: Page
title: "GAP-L1-P0-claude-code-plugin-component-types"
slug: "process/gaps/GAP-L1-P0-claude-code-plugin-component-types"
articlePath: "wiki/process/gaps/GAP-L1-P0-claude-code-plugin-component-types.md"
documents: []
---
# GAP-L1-P0-claude-code-plugin-component-types

| Field | Value |
|---|---|
| id | gap:claude-code-plugin-component-types |
| title | Claude Code plugin format adds LSP servers, background monitors, bin/, settings.json, .claude-plugin/plugin.json — not in schema |
| level | 1 |
| priority | P0 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://code.claude.com/docs/en/plugins |
| status | closed |
| owner | tbd |

## Current state
The `Plugin` and `NativeExtension` NodeKinds enumerate `contains_skill`, `contains_subagent`, `contains_tool_server` edges. There is no representation of:
- **LSP servers** (`.lsp.json`) — a new component type giving Claude real-time code intelligence
- **Background monitors** (`monitors/monitors.json`) — long-running stdout-emitting processes that surface notifications
- **`bin/` directory** — plugin-provided executables added to PATH
- **Plugin-shipped `settings.json`** — currently scoped to `agent` and `subagentStatusLine`
- **`.claude-plugin/plugin.json`** manifest path (current example uses `plugin.json` at root)
- **Skills vs. commands distinction** — Claude Code now treats `commands/` as legacy "flat markdown skills" and `skills/` as the canonical form
- **`disable-model-invocation`** frontmatter on SKILL.md
- **`/reload-plugins`** lifecycle event

## Desired state
- New NodeKinds: `LSPServer`, `BackgroundMonitor`, `BinaryProvider`.
- New edges: `Plugin contains_lsp_server LSPServer`, `Plugin contains_monitor BackgroundMonitor`, `Plugin contains_bin BinaryProvider`, `Plugin ships_settings SettingsTemplate`.
- Extend `Skill` with `disableModelInvocation: bool`, `argumentsToken: string` (e.g. `$ARGUMENTS`), `entrypoint` enum to distinguish `SKILL.md` vs flat-markdown-command.
- Extend `Plugin` with `manifestPath` attribute (`.claude-plugin/plugin.json`).
- Add `HookSurface` instances for `ReloadPlugins`, `MonitorEvent`.

## Evidence
- https://code.claude.com/docs/en/plugins ("LSP servers", "Background monitors", "bin/", "settings.json", ".claude-plugin/")
- https://code.claude.com/docs/en/plugins-reference

## Propagation status
- Level 1: open
- Level 2: not-started — `02-node-kinds/extensions-plugins.md` needs three new sections; `coverage-checklist.md` Plugin section needs three new rows
- Level 3+: cascade

## Propagation chain
- Level 1: add NodeKinds + edges + 1 example each in `schema/examples/extensions/`.
- Level 2: update 02-node-kinds/extensions-plugins.md and 03-edge-kinds.md.

## Notes
LSP and background monitors are entirely new component types — they don't fit any existing NodeKind. This is real Claude Code product surface evolution, P0.

## Resolution (2026-04-28)
Closed. NodeKinds `LSPServer`, `BackgroundMonitor`, `BinaryProvider`, `SettingsTemplate` were added in earlier passes (per the user-provided audit hint). Edges `Plugin contains_lsp_server`, `Plugin contains_monitor`, `Plugin contains_bin`, `Plugin ships_settings` are present in `03-edge-kinds.md`.
