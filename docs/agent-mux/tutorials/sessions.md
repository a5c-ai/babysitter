# Sessions

Agent-mux persists every run as a **session**: a JSONL file written by the
underlying CLI (Claude, Codex, Gemini, …) that you can list, resume, inspect,
and export through the SDK or `amux` CLI.

## Listing sessions

```ts
import { AgentMuxClient } from '@a5c-ai/agent-mux';

const client = new AgentMuxClient();
const sessions = await client.listSessions({ agent: 'claude' });
for (const s of sessions) {
  console.log(s.sessionId, s.title ?? '(no title)', s.modifiedAt);
}
```

From the CLI:

```bash
amux sessions list --agent claude
amux sessions list --agent codex --limit 20
```

## Resuming a session

Pass `sessionId` to `run()`. The adapter rehydrates the conversation on disk
and the CLI picks up where it left off:

```ts
await client.run({
  agent: 'claude',
  sessionId: 'abc123',
  prompt: 'Continue from where we stopped.',
});
```

```bash
amux run claude --session-id abc123 "Continue from where we stopped."
```

## Reading session contents

Each adapter exposes `parseSessionFile()` which returns a normalized `Session`
object (messages, tool calls, cost totals). This is useful for building
dashboards or replaying a run:

```ts
const adapter = client.registry.get('claude');
const paths = await adapter.listSessionFiles();
const parsed = await adapter.parseSessionFile(paths[0]);

console.log(parsed.messages.length, 'messages');
console.log(parsed.totalCost?.totalUsd ?? 0, 'USD');
```

## Where sessions live

| Agent     | Default path                               |
|-----------|--------------------------------------------|
| claude    | `~/.claude/projects/`                      |
| codex     | `~/.codex/sessions/`                       |
| cursor    | `~/.cursor/sessions/`                      |
| gemini    | `~/.gemini/sessions/`                      |
| opencode  | `~/.config/opencode/sessions/`             |

Override by setting the adapter's `sessionDir(cwd?)` — or pass `cwd` on the
run and adapters that key on cwd will scope their sessions accordingly.

## Watching sessions

Live session watching is not currently exposed on `SessionManager`.

Earlier tutorial drafts mentioned `watchSessions()`, but no truthful cross-adapter contract is
available yet. Use `list()`, `get()`, `search()`, `export()`, and `diff()` for read-only session
inspection.
