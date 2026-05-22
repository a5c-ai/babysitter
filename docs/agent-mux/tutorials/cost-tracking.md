# Cost tracking

agent-mux emits a `cost` event whenever an adapter reports usage. You can
read it in two ways: **live** (during `client.run`) or **retroactively**
(from a stored session).

## Live: per-run budget meter

```ts
import { createClient } from '@a5c-ai/agent-mux';

const client = createClient();
const handle = client.run({ agent: 'claude-code', prompt: '…' });

let spent = 0;
for await (const ev of handle.events()) {
  if (ev.type === 'cost') {
    spent = ev.cost.totalUsd ?? spent;
    if (spent > 0.50) { await handle.stop('budget exceeded'); break; }
  }
}
await handle.done;
```

The final total is also available as `(await handle.done).cost`.

## Retroactive: aggregate a stored session

`client.sessions(agent).read(id)` returns the replayed event list — the
same events the live stream produced. Fold them with the exported helper:

```ts
import { createClient, sumCost } from '@a5c-ai/agent-mux';

const sessions = createClient().sessions('claude-code');
const { events } = await sessions.read(sessionId);
const totals = sumCost(events);
console.log(`$${totals.totalUsd.toFixed(4)} · ${totals.totalTokens} tok`);
```

`sumCost` accepts any `Iterable<AgentEvent>`. The async variant
`sumCostAsync` works directly on `handle.events()`:

```ts
import { sumCostAsync } from '@a5c-ai/agent-mux';
const totals = await sumCostAsync(handle.events());
```

## Filter helpers

`filterEvents(events, type)` returns a narrowed iterator — useful when you
want every tool result, every thinking delta, etc., without writing the
switch yourself:

```ts
import { filterEvents } from '@a5c-ai/agent-mux';

for (const tool of filterEvents(events, 'tool_result')) {
  // tool.toolName, tool.output, tool.durationMs are all typed
}
```

## CLI

```bash
# Sum cost across every stored session for an agent
amux sessions list --agent claude-code --json \
  | jq -r '.[].sessionId' \
  | while read sid; do
      amux sessions read --agent claude-code --id "$sid" --json \
        | jq '[.events[]|select(.type=="cost")|.cost.totalUsd]|add // 0'
    done \
  | paste -sd+ | bc
```

## Caveats

- Not every adapter reports USD. Adapters without pricing data emit
  `cost` events with `totalUsd: 0` and token counts only.
- Cached-token pricing is adapter-specific; `sumCost` exposes
  `cachedTokens` separately so you can apply your own multiplier.
- `cost` events may fire multiple times in one run (turn-level and
  run-level). `sumCost` adds them all — that's by design: the sum is the
  run total. If you only want the final event, use
  `(await handle.done).cost`.
