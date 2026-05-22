# Remote bootstrap

The `agent-mux-remote` adapter lets you drive a coding agent that runs on a
remote host — over SSH, in a container, or behind a gateway. "Bootstrap" is
the process of getting the remote side ready: installing `amux`, wiring
credentials, and establishing a session channel.

## 1. Install on the remote host

```bash
# On the remote machine
curl -fsSL https://nodejs.org/dist/v22.x/node-v22.x-linux-x64.tar.xz | tar -xJ
npm i -g @a5c-ai/agent-mux-cli
```

Or use the built-in bootstrap command, which copies an install script over
SSH and runs it:

```bash
amux remote bootstrap user@host --agent claude
```

This installs the CLI, ensures the target harness (e.g. `@anthropic-ai/claude-code`)
is present, and writes a minimal `~/.amux/config.json` on the remote.

## 2. Configure credentials

The remote host needs the same env vars (or config files) that the local
setup would need. Options:

- **env-forward** (default): `amux` forwards `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` /
  etc. from the local shell into the SSH session for the lifetime of the run.
- **config-file**: pre-seed `~/.claude/auth.json` (or equivalent) on the remote
  so the harness authenticates without env vars.
- **per-call**: pass `env: { ANTHROPIC_API_KEY: '…' }` to `run()`.

## 3. Running against the remote

```ts
import { AgentMuxClient } from '@a5c-ai/agent-mux';

const client = new AgentMuxClient();
const handle = await client.run({
  agent: 'agent-mux-remote',
  remote: { host: 'user@host', agent: 'claude' },
  prompt: 'Summarize the repository in two paragraphs.',
});

for await (const ev of handle.events()) {
  if (ev.type === 'text_delta') process.stdout.write(ev.text);
}
```

From the CLI:

```bash
amux run agent-mux-remote \
  --remote-host user@host \
  --remote-agent claude \
  "Summarize the repository."
```

## 4. Invocation modes

The remote adapter respects agent-mux's invocation modes:

- `mode: 'host'` — spawn the remote CLI directly (SSH exec).
- `mode: 'docker'` — run the remote CLI inside a container on the remote host.
- `mode: 'k8s'` — submit the remote CLI as an ephemeral pod.

See [docker-mode](./docker-mode.md) and [k8s-mode](./k8s-mode.md) for the
container flavors — the same flags apply to `agent-mux-remote`.

## 5. Tearing down

`amux remote teardown user@host` removes `~/.amux/`, the installed harness
(if you used `bootstrap`), and any cached sessions. Use `--keep-sessions` to
preserve the history directory.
