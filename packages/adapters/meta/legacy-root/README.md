# agent-mux

`@a5c-ai/adapters` is a unified TypeScript SDK and CLI (`adapters`) for driving heterogeneous coding-agent harnesses — Claude Code, Codex, Gemini, Copilot, Cursor, OpenCode, OpenCode HTTP, pi, omp, openclaw, hermes, qwen — through one contract.

It spawns real subprocesses, normalizes their streaming output into a shared `AgentEvent` stream, and exposes each harness's sessions, config, auth, and plugins through a single `AgentMuxClient` interface. Invocations can run locally, in Docker, over SSH, or in a Kubernetes pod with no code change.

## Install

```bash
# SDK + CLI
npm install @a5c-ai/adapters

# SDK only
npm install @a5c-ai/comm-adapter @a5c-ai/adapters-codecs

# Zero-install CLI
npx @a5c-ai/adapters --help
```

Requires Node.js 20.9.0 or later. ESM-first, with a CJS compatibility shim.

## Quickstart

```bash
# Run a prompt against a harness you have installed locally
adapters run --agent claude-code --prompt "Summarize README.md"

# Streaming JSON events (one per line)
adapters run --agent codex --prompt "Add a test for foo()" --json

# Pick a profile (named RunOptions preset)
adapters run --profile fast-claude --prompt "..."
```

SDK:

```ts
import { createClient } from '@a5c-ai/adapters';

const client = createClient();
const handle = client.run({ agent: 'claude-code', prompt: 'hello' });

for await (const event of handle.events()) {
  if (event.type === 'text_delta') process.stdout.write(event.text);
}
await handle.done;
```

## Supported agents

| Agent | CLI | Session dir |
|---|---|---|
| `claude` / `claude-code` | `claude` | `~/.claude/projects` |
| `codex` | `codex` | `~/.codex/sessions` |
| `gemini` | `gemini` | `~/.gemini/sessions` |
| `copilot` | `gh copilot` | `~/.config/github-copilot/sessions` |
| `cursor` | `cursor-agent` | `~/.cursor/sessions` |
| `opencode` | `opencode` | `~/.config/opencode/sessions` |
| `opencode-http` | `opencode serve` | `~/.config/opencode/sessions` |
| `pi` | `pi` | `~/.pi/agent/sessions` |
| `omp` | `omp` | `~/.omp/agent/sessions` |
| `openclaw` | `openclaw` | `~/.openclaw/sessions` |
| `hermes` | `hermes` | `~/.hermes/sessions` |
| `qwen` | `qwen` | `~/.qwen/sessions` |
| `agent-mux-remote` | `adapters` | (transport-delegated) |

Install or update any of them through `adapters`:

```bash
adapters install claude-code          # npm / brew / manual, adapter-specified
adapters update codex
adapters detect --all --json          # probe installations
adapters detect-host                  # is this shell already inside a harness?
```

## Features

### Unified event stream
Every harness — regardless of wire format (JSONL, stream-json envelopes, SSE, app-server frames, ANSI) — is normalized into the same `AgentEvent` union: `text_delta`, `thinking_delta`, `tool_call_start`, `tool_input_delta`, `tool_call_ready`, `tool_result`, `message_stop`, `cost`, `error`. Write your UI once; swap harnesses without touching render code.

### Sessions
`client.sessions(agent)` lists, reads, resumes, forks, and watches persistent harness sessions from their on-disk stores (`~/.claude/projects`, `~/.codex/sessions`, `~/.gemini/sessions`, …). `RunOptions.sessionId` reconnects; `forkSessionId` branches a new session from an existing transcript. `noSession: true` runs ephemerally.

### Invocation modes
One option flips where the subprocess actually runs: `local`, `docker` (with volumes/image/env), `ssh` (identity file, remote cwd), or `k8s` (namespace, image, pod spec overlay). The adapter contract is unchanged — streaming, sessions, and cost events still flow back over the chosen transport.

### Hooks
`adapters hooks install` wires a command to a harness event (`PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`, …). Native hooks are written into the harness's own config (e.g. `~/.claude/settings.json`); harnesses without native hook support get a virtual hook layer driven off the event stream. Same UX, different mechanism.

### MCP plugins
`adapters plugins install <server> --agent claude` adds an MCP server entry in the harness's config file. Supported on claude, codex, gemini, cursor, opencode, opencode-http, openclaw (and qwen via MCP-compatible config). `list` / `uninstall` work symmetrically.

### Skills & sub-agents
`adapters skill add <agent> <folder>` copies a skill folder into the harness convention path (e.g. `.claude/skills/`, `.codex/skills/`). `adapters agent add <agent> <file>` does the same for sub-agent definitions (e.g. `.claude/agents/`). Both accept `--global` / `--project` scope, `--force` to overwrite, and have `list` / `remove` / `where` subcommands. File-convention only — no native harness command needed.

### Auth & install detection
`adapters doctor` reports each harness's binary presence, version, auth state (env var, config file, browser token), and config directory health. `adapters detect --all --json` is the machine-readable form. `adapters install <agent>` / `update <agent>` dispatches to the adapter-declared install method (npm, brew, curl script).

### Capabilities & models
Every adapter declares an `AgentCapabilities` record (streaming, thinking, parallel tools, MCP, PTY requirement, image IO, skills, subagents, platforms) and a `ModelCapabilities[]` list (context window, pricing, thinking budgets, tool support). Build agent pickers, cost estimators, and feature-gated UIs directly off the declared capability surface.

### Cost tracking
Adapters that expose pricing/usage emit `cost` events (input/output tokens, cache reads, USD). `adapters run --json` surfaces them on stdout; the SDK bubbles them through `handle.events()` alongside text.

### Profiles
`RunOptions` presets under a name. `adapters profiles` lists them; `adapters run --profile fast-claude` applies one. Layerable over explicit flags.

### Mock harness
`@a5c-ai/adapters-harness-mock` ships deterministic scenario scripts (`claudeCodeSuccess`, `codexToolError`, …) and a `MockProcess` that replays them without any real binary, API key, or network. Pair with `WorkspaceSandbox` to test file-operation side effects. `adapters run --use-mock-harness` drives the full CLI against mocks.

### Remote bootstrap
`adapters remote install <host> --harness <agent>` uploads the SDK, installs the harness on the target, and verifies. Works over ssh and k8s; used to stand up stateless runners.

### Host detection
`adapters detect-host` returns which harness (if any) this shell is already running inside — useful for adapters that want to refuse re-entry or skip re-auth.

## SDK examples

### Real-time streaming: text, thinking, tools, cost

```ts
import { createClient } from '@a5c-ai/adapters';

const client = createClient();
const handle = client.run({
  agent: 'claude-code',
  prompt: 'Refactor src/api.ts to use async/await',
  model: 'claude-sonnet-4-20250514',
});

let totalUsd = 0;
for await (const event of handle.events()) {
  switch (event.type) {
    case 'text_delta':
      process.stdout.write(event.delta);
      break;
    case 'thinking_delta':
      process.stderr.write(`\x1b[90m${event.delta}\x1b[0m`);
      break;
    case 'tool_call_start':
      console.log(`\n→ ${event.toolName}(${event.toolCallId})`);
      break;
    case 'tool_input_delta':
      process.stdout.write(event.delta);
      break;
    case 'tool_result':
      console.log(`\n← ${event.toolCallId} (${event.durationMs}ms)`);
      break;
    case 'cost':
      totalUsd = event.cost.totalUsd ?? totalUsd;
      console.log(`\n$${totalUsd.toFixed(4)} so far`);
      break;
    case 'error':
      console.error(`error: ${event.message}`);
      break;
  }
}
await handle.done;
```

### Non-realtime: read cost/tokens from a completed session

Use the exported `sumCost` / `filterEvents` helpers — no per-call reduce:

```ts
import { createClient, sumCost, filterEvents } from '@a5c-ai/adapters';

const sessions = createClient().sessions('claude-code');
const [last] = await sessions.list();
const { events } = await sessions.read(last.sessionId);

const totals = sumCost(events);
console.log(`$${totals.totalUsd.toFixed(4)} · ${totals.totalTokens} tok · ${totals.costEventCount} cost events`);

for (const tr of filterEvents(events, 'tool_result')) {
  console.log(`${tr.toolName} took ${tr.durationMs}ms`);
}
```

### Resume vs. fork

```ts
// Reconnect to an existing session
const resumed = client.run({ agent: 'claude-code', sessionId: last.sessionId, prompt: 'continue' });

// Branch a new session from an existing transcript
const forked = client.run({ agent: 'claude-code', forkSessionId: last.sessionId, prompt: 'try a different approach' });
```

### Live cost meter with a hard budget

```ts
async function runWithBudget(agent: string, prompt: string, maxUsd: number) {
  const handle = client.run({ agent, prompt });
  let spent = 0;
  for await (const ev of handle.events()) {
    if (ev.type === 'cost') {
      spent = ev.cost.totalUsd ?? spent;
      if (spent > maxUsd) { await handle.stop('budget exceeded'); break; }
    }
  }
  return spent;
}
```

### CLI equivalents

```bash
# Realtime: filter cost events from JSON stream
adapters run --agent claude-code --prompt '...' --json | jq 'select(.type=="cost")'

# Non-realtime: sum cost from a stored session
adapters sessions list --agent claude-code --json
adapters sessions read --agent claude-code --id <sid> --json \
  | jq '[.events[]|select(.type=="cost")|.cost.totalUsd]|add'
```

## Invocation modes

A single `RunOptions.invocation` (or CLI `--mode`) picks where the harness runs:

```ts
client.run({ agent: 'claude-code', prompt: '...', invocation: { mode: 'local' } });
client.run({ agent: 'codex', prompt: '...', invocation: {
  mode: 'docker', image: 'ghcr.io/openai/codex', volumes: ['/cache:/cache'],
}});
client.run({ agent: 'claude-code', prompt: '...', invocation: {
  mode: 'ssh', host: 'user@builder', identityFile: '~/.ssh/id_ed25519',
}});
client.run({ agent: 'gemini', prompt: '...', invocation: {
  mode: 'k8s', namespace: 'runners', image: 'ghcr.io/google/gemini-cli',
}});
```

Remote bootstrap (installs `adapters` + harness on the target, then verifies):

```bash
adapters remote install builder.example.com --harness claude-code
adapters remote update  builder.example.com --harness codex --mode ssh
```

See [docs/13-invocation-modes.md](docs/13-invocation-modes.md).

## Docker

The repository ships a `Dockerfile` that builds an image with one or more harnesses pre-installed via `adapters install`:

```bash
docker build --build-arg HARNESSES=claude-code,codex -t adapters .
docker run --rm -it -v "$PWD:/workspace" adapters run --agent claude-code --prompt '...'
```

## Testing with harness-mock

`@a5c-ai/adapters-harness-mock` simulates harness subprocesses with no real binary, API key, or network. Use it for deterministic adapter tests.

```ts
import { MockProcess, claudeCodeSuccess, WorkspaceSandbox } from '@a5c-ai/adapters-harness-mock';

const sandbox = new WorkspaceSandbox();
const proc = new MockProcess(claudeCodeSuccess);
// Drive proc.stdout / stdin; apply scenario.fileOperations against sandbox.
```

See [docs/14-harness-mock.md](docs/14-harness-mock.md).

## Important Notes

### OpenCode Project Distinction

**Note**: There are two different projects named "OpenCode":
- ✅ **Supported**: [anomalyco/opencode](https://github.com/anomalyco/opencode) - This is the OpenCode project that agent-mux supports
- ❌ **Not supported**: `opencode-ai/opencode` (renamed to [charmbracelet/crush](https://github.com/charmbracelet/crush)) - This project is **not supported** by agent-mux

When referring to OpenCode in agent-mux documentation and code, we always mean the anomalyco/opencode project.

## Contributing

- `npm install` at the repo root.
- `npm run build` — TypeScript build across all workspaces.
- `npm test` — vitest unit tests. `npm run test:e2e` — end-to-end suite.
- `npm run lint` — ESLint with a local `max-file-lines` rule (400 effective lines).
- `npm run hooks:install` — wires `.githooks/pre-commit`, which runs build + lint + tests on staged changes.

Specs live in [docs/](docs/) (numbered 01–14); they are the source of truth for API shape and behavior. File a PR with spec updates alongside code changes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the manual publish / version-bump flow.

## Packages

This repo is an npm workspaces monorepo. Each published package has its own README:

- [`@a5c-ai/adapters`](packages/adapters/README.md) — meta-package (SDK + CLI convenience install).
- [`@a5c-ai/comm-adapter`](packages/core/README.md) — core types, client, stream engine.
- [`@a5c-ai/adapters-codecs`](packages/adapters/README.md) — built-in harness adapters.
- [`@a5c-ai/adapters-cli`](packages/cli/README.md) — the `adapters` command-line binary.
- [`@a5c-ai/adapters-harness-mock`](packages/harness-mock/README.md) — mock harness simulator for tests.

License: MIT.
