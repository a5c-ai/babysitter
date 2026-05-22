# Multi-Agent Dispatch

agent-mux lets you fan out a prompt to multiple adapters and merge the result stream. This is useful for voting, consensus, or comparison.

## Parallel dispatch

```ts
import { createClient } from '@a5c-ai/agent-mux';

const client = createClient();

const handles = await Promise.all([
  client.run({ agent: 'claude',   prompt: 'Explain the PR' }),
  client.run({ agent: 'gemini',   prompt: 'Explain the PR' }),
  client.run({ agent: 'opencode', prompt: 'Explain the PR' }),
]);

const results = await Promise.all(
  handles.map(async (h) => {
    let text = '';
    for await (const ev of h.events()) {
      if (ev.type === 'text_delta') text += ev.delta;
    }
    return { agent: h.agent, text };
  }),
);
```

## CLI

```bash
amux run claude,gemini,opencode --prompt "Explain the PR" --json | \
  jq -s 'group_by(.agent)'
```

The CLI interleaves events from all adapters on stdout, tagged with `agent` so consumers can demux.

## Strategies

- **First-to-finish** — await `Promise.race(handles.map(h => h.done()))` and cancel the rest with `handle.abort()`.
- **Consensus** — collect all final texts, run a reducer agent (e.g. Claude) to pick the best.
- **Subagent dispatch** — on adapters with `supportsSubagentDispatch` (Claude), use one agent as the orchestrator and others as workers via the remote adapter.

## Combining with invocation modes

Each handle can use a different invocation mode — for example, run Claude locally and Gemini in a container:

```ts
client.run({ agent: 'claude', prompt, invocationMode: { kind: 'local' } });
client.run({
  agent: 'gemini',
  prompt,
  invocationMode: { kind: 'docker', image: 'my/gemini:latest' },
});
```

See the per-agent pages for flag compatibility.
