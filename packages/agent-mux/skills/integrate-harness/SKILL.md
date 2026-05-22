---
name: integrate-harness
description: Use when adding a new agent harness (CLI-based coding agent) adapter to agent-mux. Covers capability audit, adapter scaffold, session parsing, auth detection, hooks/plugins wiring, tests, and docs.
---

# integrate-harness

Goal: produce a production-quality `XAdapter extends BaseAgentAdapter` with full test coverage and documentation, matching the level of the existing 11 adapters (claude, codex, cursor, gemini, opencode, openclaw, copilot, hermes, pi, omp, agent-mux-remote).

## Checklist

1. **Capability audit** — read the harness's CLI docs. Fill in every `AgentCapabilities` field. Unknown? Set conservatively (`false`) and note in PR.
2. **Create `packages/adapters/src/<name>-adapter.ts`** extending `BaseAgentAdapter`. Required: `agent`, `displayName`, `cliCommand`, `minVersion`, `hostEnvSignals`, `capabilities`, `models[]`, `defaultModelId`, `configSchema`, `buildSpawnArgs`, `parseEvent`, `detectAuth`, `getAuthGuidance`, `sessionDir`, `parseSessionFile`, `listSessionFiles`, `readConfig`, `writeConfig`.
3. **Session parsing** — if the harness stores JSONL sessions, delegate to `parseJsonlSessionFile`; otherwise write a custom parser and unit-test each event shape.
4. **Hooks** — if the harness supports native hooks, override `writeNativeHook` and mirror into `HookConfigManager`. If not, rely on the base class's virtual hooks.
5. **Plugins** — if it supports MCP servers under `mcpServers` in its config JSON, flip `supportsPlugins: true`, add `pluginFormats: ['mcp-server']`, and delegate to `mcp-plugins.ts` (see cursor/gemini/opencode/openclaw for the pattern).
6. **Register** — add to `packages/adapters/src/index.ts` exports and to the default registry in `packages/core/src/client.ts` (if applicable).
7. **Tests** — in `packages/adapters/tests/<name>-adapter.test.ts`:
   - capability shape
   - `buildSpawnArgs` for a few representative `RunOptions`
   - `parseEvent` for each JSONL type the harness emits
   - `detectAuth` for authenticated + unauthenticated states
   - session file parsing from a real fixture (redacted)
   - If plugins: add the adapter to `mcp-plugins-parity.test.ts`.
8. **CLI audit test** — ensure `packages/cli/tests/commands-audit.test.ts` passes (it exercises every adapter via the built CLI).
9. **File-size limit** — each source file must stay under 400 effective lines (`local/max-file-lines`). Split helpers into sibling modules if you're close.
10. **Docs** — add a row to the README capabilities matrix and a paragraph in `docs/02-agents/<name>.md`.
11. **Changeset** — `npm run changeset`, pick `minor` (new adapter), summarize.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npx vitest run packages/adapters/tests/<name>-adapter.test.ts
```

All existing tests must continue to pass — no regressions in commands-audit.

## Common pitfalls

- Forgetting to add the adapter to the default registry → `commands-audit.test.ts` won't exercise it.
- JSONL parsers that assume a single event per line — some harnesses emit arrays.
- Auth detection that reads env vars synchronously at construction time instead of `detectAuth()` — breaks testability.
- `buildSpawnArgs` returning the string `"undefined"` for missing options — always gate with `if (options.X != null)`.
- Hook writers that overwrite rather than merge — use `appendJsonHook` or `appendYamlHook`.
