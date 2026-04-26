# agent-mux-remote

Meta-adapter that invokes `amux` on a **remote target** (SSH host, Docker container, or Kubernetes pod) and bridges its event stream back to the local client. Useful for running any supported agent in an isolated or remote environment.

## Install

```bash
amux install agent-mux-remote
```

Supported on macOS, Linux and Windows.

## Auth

Auth is delegated to the invocation mode:

- `local` — reuse the current shell's env.
- `ssh` — SSH config / keys.
- `docker` — Docker context; env vars are passed via `-e`.
- `k8s` — kubectl context.

The adapter itself has no credentials of its own.

## Minimal run

```bash
AMUX_REMOTE_AGENT=claude \
  amux run agent-mux-remote --prompt "Hello from a container"
```

Or explicitly:

```ts
await client.run({
  agent: 'agent-mux-remote',
  prompt: 'Hello',
  invocationMode: { kind: 'docker', image: 'my/amux:latest' },
  env: { AMUX_REMOTE_AGENT: 'claude' },
});
```

## Notable flags

The adapter emits:

```
amux run --json --agent <AMUX_REMOTE_AGENT> --prompt <text>
    [--model <id>] [--session <id>] [--yolo|--deny]
```

The **invocation mode** (ssh/docker/k8s) wraps these args. See [Invocation Modes](../13-invocation-modes.md).

## Session files

- `sessionDir()` returns `''` — sessions live on the remote target under that agent's own session directory.

## Plugins

Plugin support: **no**. Use MCP servers for extensibility.

### MCP Servers
```bash
amux mcp install agent-mux-remote <mcp-server>
amux mcp list agent-mux-remote
```

Registry: https://modelcontextprotocol.io

## Known limitations

- No bundled models — `defaultModelId` is `undefined`. You must pick the model via `RunOptions.model` according to the remote agent.
- No config schema of its own; config lives with the remote agent.
- Session resume works only if the remote agent supports it and the session file is reachable on the target.
- Because events are proxied, extra latency vs. running locally.
