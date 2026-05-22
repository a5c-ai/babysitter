# Hooks

Hooks let you observe and intercept agent activity at well-defined points without modifying the adapter.

## Lifecycle points

| Hook          | Fires                                                  |
| ------------- | ------------------------------------------------------ |
| `PreToolUse`  | Before a tool call is dispatched. Can deny or rewrite. |
| `PostToolUse` | After a tool call returns. Can annotate or redact.     |
| `Stop`        | When the run terminates (done, error, or cancelled).   |

The set mirrors Claude Code's native hooks; agent-mux normalizes them across adapters.

## Registering

```ts
await client.run({
  agent: 'claude',
  prompt: 'Do stuff',
  hooks: {
    PreToolUse: async (ctx) => {
      if (ctx.tool === 'Bash' && /rm -rf/.test(ctx.input.command)) {
        return { decision: 'deny', reason: 'destructive command' };
      }
      return { decision: 'allow' };
    },
    PostToolUse: async (ctx) => {
      console.log('[tool]', ctx.tool, ctx.durationMs, 'ms');
    },
    Stop: async (ctx) => {
      console.log('[done]', ctx.reason);
    },
  },
});
```

CLI users can register hooks via `~/.amux/hooks/*.js` or per-project `.amux/hooks/`. Run `amux hooks list` to see what's active.

## Virtual hooks

Adapters whose underlying CLI doesn't natively expose hooks get **virtual hooks**: agent-mux interposes in the event stream and fires the same `PreToolUse` / `PostToolUse` handlers based on parsed `tool_call_start` / `tool_call_result` events. The effect is best-effort — denial may arrive after the call has already been issued.

Adapters with native hook support (e.g. Claude Code) get real interception.

## Return shape

```ts
type HookDecision =
  | { decision: 'allow' }
  | { decision: 'deny'; reason: string }
  | { decision: 'rewrite'; input: unknown };
```

See [Hooks reference](../reference/15-hooks.md) for the full context object and examples.
