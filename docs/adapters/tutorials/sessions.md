# Sessions

Adapters reads each agent's native **session** storage through a shared
persistent-session registry. Most targets use JSONL files written by the
underlying CLI, while some targets use JSON or SQLite. The SDK and `adapters`
CLI normalize those formats so you can list, resume, inspect, and export
sessions consistently.

## Listing sessions

```ts
import { AgentMuxClient } from '@a5c-ai/adapters';

const client = new AgentMuxClient();
const sessions = await client.listSessions({ agent: 'claude' });
for (const s of sessions) {
  console.log(s.sessionId, s.title ?? '(no title)', s.modifiedAt);
}
```

From the CLI:

```bash
adapters sessions list --agent claude
adapters sessions list --agent codex --limit 20
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
adapters run claude --session-id abc123 "Continue from where we stopped."
```

## Reading session contents

Use the `sessions` surface for normalized content. It preserves the native
session ID, adds the deterministic unified ID (`<agent>:<native-id>`), and
uses the same registry path as gateway and CLI session APIs:

```ts
const parsed = await client.sessions.get('claude', 'abc123');

console.log(parsed.messages.length, 'messages');
console.log(parsed.cost?.totalUsd ?? 0, 'USD');
console.log(parsed.unifiedId); // claude:abc123
```

Direct adapter methods (`sessionDir()`, `listSessionFiles()`, and
`parseSessionFile()`) are still available for compatibility, but new code should
prefer `client.sessions` so native adapters and plugin-generated targets follow
the same contract.

## Where sessions live

| Agent     | Default path                               |
|-----------|--------------------------------------------|
| claude    | `~/.claude/projects/`                      |
| codex     | `~/.codex/sessions/`                       |
| cursor    | `~/.cursor/sessions/`                      |
| gemini    | `~/.gemini/sessions/`                      |
| opencode  | `~/.config/opencode/sessions/`             |
| pi        | `~/.pi/agent/sessions/`                    |

Atlas `SessionSemantics` and `PluginTarget` metadata describe target aliases,
session ID sources, and directory strategies. The runtime registry uses that
metadata when available, while target-specific codecs keep responsibility for
parsing native formats.

## Plugin targets and gateway sessions

Plugin-generated targets use the same session registry as native adapters. A
target may be addressable by its Atlas `PluginTarget.targetId` or by the
underlying adapter name; the normalized session still uses the adapter-native
session ID and the deterministic unified ID.

Gateway session endpoints (`/api/v1/sessions`, `/api/v1/sessions/:id`, and
`/api/v1/sessions/:id/full`) prefer the SDK `client.sessions` path. That keeps
gateway responses aligned with CLI and SDK output. A direct adapter-file fallback
exists only for embedded clients that do not expose `client.sessions`.

## Watching sessions

Live session watching is not currently exposed on `SessionManager`.

Earlier tutorial drafts mentioned `watchSessions()`, but no truthful cross-adapter contract is
available yet. Use `list()`, `get()`, `search()`, `export()`, and `diff()` for read-only session
inspection.
