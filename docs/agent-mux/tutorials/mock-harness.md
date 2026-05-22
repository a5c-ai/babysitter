# Mock Harness

The mock harness replaces the real CLI spawn with a scripted event stream. Use it for tests, CI, and demos where real credentials or network access are undesirable.

## Enabling

Two equivalent switches:

```bash
amux run claude --use-mock-harness --prompt "test"
```

or globally:

```bash
export USE_MOCK_HARNESS=1
amux run claude --prompt "test"
```

Programmatically:

```ts
await client.run({
  agent: 'claude',
  prompt: 'test',
  useMockHarness: true,
});
```

## Scenarios

The mock emits a deterministic sequence of `AgentEvent`s chosen by scenario name:

| Scenario          | What it emits                                               |
| ----------------- | ----------------------------------------------------------- |
| `text`            | A few `text_delta` events and a final `done`.               |
| `tool-call`       | `text_delta` → `tool_call_start` → `tool_call_result` → `done`. |
| `thinking`        | `thinking_delta` events before the final message.           |
| `error`           | Emits an `error` event with `recoverable: false`.           |
| `session-resume`  | Replays a prior session snapshot.                           |

Pick one with `--scenario`:

```bash
amux run claude --use-mock-harness --scenario tool-call --prompt "x"
```

If you invoke the package binary directly, the same agent scoping is available
there too:

```bash
mock-harness --agent claude --list
mock-harness --agent claude --scenario tool-call
```

Interactive approval scenarios under `packages/agent-mux/harness-mock` now model real gating semantics rather than timer-only replay:

- `interactive:yolo` auto-approves and then emits the post-approval output.
- `interactive:prompt` waits for stdin before it emits the post-approval output and exits.
- `interactive:deny` auto-denies, emits the denial path, and exits non-zero.
- `interactive:timeout` waits for approval until the configured timeout, emits a timeout error, and exits non-zero.

## Why use it

- **CI**: No API keys, no flakiness.
- **Adapter tests**: Validate `parseEvent` without invoking the real CLI.
- **Integration tests**: Exercise hooks, session-save paths, and the event stream in isolation.

See [Harness & Mock](../reference/14-harness-mock.md) for the full event script format.
