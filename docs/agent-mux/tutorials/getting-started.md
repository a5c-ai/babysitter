# Getting Started

This walkthrough installs `@a5c-ai/agent-mux`, verifies your environment, and runs your first agent.

## 1. Install

```bash
npm install -g @a5c-ai/agent-mux
```

Verify:

```bash
amux --help
```

You should see the top-level commands: `run`, `detect`, `agent`, `plugin`, `session`, `hooks`, `remote`.

## 2. Detect available agents

```bash
amux detect
```

This probes your `PATH` for each supported adapter (`claude`, `codex`, `cursor`, `gemini`, `opencode`, `opencode-http`, `openclaw`, `copilot`, `hermes`, `pi`, `omp`) and prints version, auth status, and install suggestions for any that are missing.

To install one via the bundled installer:

```bash
amux agent install claude
```

## 3. Set credentials

Set the env var required by the agent you want to use, for example:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

See the per-agent pages for exact variables.

## 4. First run

```bash
amux run claude --prompt "Say hello from agent-mux"
```

Or programmatically:

```ts
import { createClient } from '@a5c-ai/agent-mux';

const client = createClient();
const handle = await client.run({
  agent: 'claude',
  prompt: 'Say hello',
});

for await (const ev of handle.events()) {
  if (ev.type === 'text_delta') process.stdout.write(ev.delta);
}

await handle.done();
```

## Next steps

- [Mock harness](./mock-harness.md) — test without real providers.
- [Hooks](./hooks.md) — inject policy around tool calls.
- [Plugins](./plugins.md) — install MCP servers.
- [Multi-agent](./multi-agent.md) — dispatch to several agents at once.
