# 15 — Unified Hooks System

`agent-mux` provides a harness-agnostic hook system that lets one
configuration drive hook dispatch across all 11 supported harnesses.

## Concepts

- **Hook type** — a harness-specific event name (e.g. `PreToolUse`,
  `StopHook`, `OnToolCall`). See `HOOK_CATALOG` in
  `@a5c-ai/agent-mux-core` for the per-harness list.
- **Registration** — a record in `.amux/hooks.json` (project) or
  `~/.amux/hooks.json` (global) that maps
  `(agent, hookType) → handler(target)`. Project overrides global by `id`.
- **Handler** — `builtin` (programmatic, in-process),
  `command` (shell command), or `script` (executable path).
- **Unified payload** — normalized `UnifiedHookPayload` with
  `{ agent, hookType, sessionId, timestamp, data, raw }`. `data` contains
  fields like `tool_name`, `tool_input`, `prompt`, etc.; `raw` preserves the
  original harness payload for bidirectional round-tripping.
- **Unified result** — `{ decision: allow|deny|modify, message?,
  modifiedInput?, stdout?, exitCode? }`. `deny` maps to exit code 2 (the
  convention used by most harnesses).

## SDK usage

```ts
import {
  HookConfigManager, HookDispatcher, builtInHooks,
  parseHookPayload, formatHookResult,
} from '@a5c-ai/agent-mux-core';

const mgr = new HookConfigManager();
await mgr.add({
  id: 'log-all',
  agent: '*',
  hookType: '*',
  handler: 'builtin',
  target: 'log',
  priority: 10,
});

const dispatcher = new HookDispatcher(mgr, builtInHooks);
const payload = parseHookPayload('claude', 'PreToolUse', { tool_name: 'Bash' });
const result = await dispatcher.dispatch(payload);
const { stdout, exitCode } = formatHookResult('claude', 'PreToolUse', result);
```

## CLI usage

```
amux hooks <agent> discover
amux hooks <agent> list
amux hooks <agent> add <hookType> [--handler builtin|command|script]
                                  [--target <id-or-cmd>]
                                  [--id <id>] [--priority N] [--global]
amux hooks <agent> remove <id> [--global|--project]
amux hooks <agent> set <id> [--priority N] [--enabled true|false] [--target ...]
amux hooks <agent> handle <hookType>   # reads JSON payload on stdin
```

`handle` is the entry point registered with harnesses (e.g. claude's
`settings.json` `"hooks"` section) — the harness pipes its payload to
stdin and `amux` dispatches all matching registrations.

## Built-in programmatic hooks

| ID                       | Description                                             |
|--------------------------|---------------------------------------------------------|
| `log`                    | Append payload to `~/.amux/hook-log.jsonl`              |
| `trace`                  | Emit a one-line trace to stdout                         |
| `claude.session-capture` | Capture claude session metadata (CLAUDE_PROJECT_DIR…)   |

Add your own with `builtInHooks.register({ id, description, fn })`.

## Dispatch semantics

1. Registrations matching `(agent, hookType)` are collected (supports `*`).
2. Disabled entries (`enabled: false`) are excluded.
3. Remaining entries are sorted by `priority` ascending (default 100).
4. Each runs in order; results are merged:
   - `deny` is sticky — further entries short-circuit.
   - `modify` wins over `allow` for the final decision.
   - `modifiedInput` objects are shallow-merged.
   - `stdout` fragments are concatenated.
   - First non-zero `exitCode` wins.
