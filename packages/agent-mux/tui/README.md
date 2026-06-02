# @a5c-ai/agent-mux-tui

Ink-based TUI for agent-mux with a plugin-first architecture. Almost everything
(message renderers, tool-call cards, diff views, session manager, chat) ships
as a plugin. The host package only provides the Ink process, view router, and
the SDK-injected `TuiContext`.

## Install

```bash
npm i -g @a5c-ai/agent-mux-tui
agent-mux-tui
```

## Development

Package-level `build` and `test` scripts are routed through the repo-root
`scripts/agent-mux-build.cjs` helper so `@a5c-ai/agent-mux-tui` runs with its
agent-mux prerequisites built in dependency order and its tests executed from
the repo root. Use `npm run build:local --workspace=@a5c-ai/agent-mux-tui`
when you only want the package-local TypeScript compile.

Run `npm run verify:release --workspace=@a5c-ai/agent-mux-tui` after a build to
confirm the packed package surface still includes the README-linked kanban/workspaces
planning artifacts.

## Kanban/workspaces surface

The package now ships first-phase `kanban` and `workspaces` views backed by the
shared kanban/workspace control plane.

- Runtime today: `kanban` view (list-first issue browsing, issue detail,
  keyboard-driven backlog actions through an injected control plane, and linked
  workspace/session handoff)
- Runtime today: `workspaces` view (workspace inventory, linked issue/session/run
  context, lifecycle actions routed through the injected control plane, and
  issue/session handoff back into the rest of the TUI)

- Spec: [`specs/kanban-workspaces-spec.md`](specs/kanban-workspaces-spec.md)
- Backlog decomposition: [`specs/kanban-workspaces-subtasks.md`](specs/kanban-workspaces-subtasks.md)
- Cross-package design note:
  [`../../docs/agent-mux/archive/design/20-tui-kanban-workspaces.md`](../../docs/agent-mux/archive/design/20-tui-kanban-workspaces.md)

The planning documents remain useful design references for follow-on expansion
of both surfaces.

## Writing a plugin

```ts
import { definePlugin } from '@a5c-ai/agent-mux-tui/plugin';
import { Text } from 'ink';
import React from 'react';

export default definePlugin({
  name: 'my-error-renderer',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'error',
      match: (ev) => ev.type === 'error',
      component: ({ event }) =>
        event.type === 'error' ? <Text color="red">{event.message}</Text> : null,
    });
  },
});
```

Pass your plugins to `App`:

```tsx
import { render } from 'ink';
import { App, builtinPlugins } from '@a5c-ai/agent-mux-tui';
import myPlugin from './my-plugin.js';

render(<App client={client} plugins={[...builtinPlugins, myPlugin]} />);
```

## Extension points

- `registerView` — top-level tab in the TUI (chat, sessions, config, …)
- `registerEventRenderer` — per-`AgentEvent` display component. The renderer
  with `id: 'fallback'` is reserved for the built-in dim one-liner that
  handles any unrecognized event type; other renderers take priority.
- `registerCommand` — global hotkey command
- `registerPromptHandler` — overrides the default `p` prompt dispatch. If any
  plugin registers a prompt handler, it receives the prompt instead of
  `client.run({ agent: defaultAgent, prompt })`.

All extension points get an injected `TuiContext` with:
- `client: AgentMuxClient` — the SDK client instance
- `eventStream: EventStream` — shared pub/sub of `AgentEvent`s. Views
  subscribe to render streaming output; commands can push synthetic events
  via `ctx.emit({ type: 'event', event })`.

## Running a prompt

Press `p` to open the prompt input, type your message, and press Enter.
Events from the resulting `client.run()` are pushed into the shared
`EventStream` and rendered by `chat-view` in registration-priority order
(specific renderers before the fallback).

The built-in plugins (`text-delta`, `thinking-delta`, `tool-call`,
`tool-error`, `cost`, `chat-view`, `sessions-view`, `fallback`) are all
implemented through these same extension points — use them as references.

The logs / observability view is part of the supported built-in surface. Press
`l` to open it. The metrics header aggregates the full buffered `EventStream`,
the global `/` filter only narrows the visible log rows, and pressing `e`
exports the full buffered stream to `session-log-<timestamp>.json` in the
current working directory.

## View hotkeys

| Key | View       | Purpose                                       |
|-----|------------|-----------------------------------------------|
| `1` | chat       | streaming run output + filter                 |
| `2` | sessions   | session list (press `d` to inspect + export)  |
| `3` | cost       | cost/usage summary                            |
| `4` | adapters   | discovered adapters                           |
| `5` | models     | model registry per adapter                    |
| `6` | profiles   | run-options profiles                          |
| `7` | plugins    | native plugins per adapter                    |
| `8` | kanban     | backlog/board browsing + issue actions        |
| `W` | workspaces | workspace lifecycle inventory + actions       |
| `9` | help       | keybindings + tips                            |
| `0` | mcp        | registered MCP servers                        |
| `-` | doctor     | capability matrix / diagnostics               |
| `l` | logs       | observability metrics + filtered log stream   |
| `A` | auth       | auth status per adapter                       |
| `C` | config     | config view                                   |
| `K` | skills     | installed skills (d: delete, r: refresh)      |
| `G` | agents     | installed sub-agents (d: delete, r: refresh)  |
| `H` | hooks      | registered hooks (d: remove, r: refresh)      |

Global: chat composer auto-focuses in `chat`; `Esc` temporarily dismisses it;
`/` filter, `:` / Ctrl-K palette, `m` model picker, `N` agent picker, `P`
profile picker, `i` interrupt, `y`/`n` approval, `q` quit.

Inside `kanban`, press `w` to jump to the linked workspace for the selected
issue. Inside `workspaces`, press `g` to jump back to the linked issue. If you
open `session-detail` from either view, `b`/`Esc` returns to the originating
surface instead of always falling back to `sessions`.

## Logs / Observability View

The `logs` view is a built-in tab registered as `builtin:observability-view`.

- Hotkey: `l`
- Purpose: show aggregated tokens, cost, latency, error count, and tool-call
  count for the buffered event stream.
- Filtering: the global `/` filter applies to the log rows in this view,
  including `type:<prefix>` filters. Metrics continue to reflect the full
  buffered stream so you can inspect a subset without losing session totals.
- Export: press `e` while the view is active to write the full buffered event
  stream as pretty-printed JSON to `session-log-<timestamp>.json` in the
  current working directory.
