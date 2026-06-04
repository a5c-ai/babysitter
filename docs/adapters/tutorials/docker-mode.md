# Docker Invocation Mode

`RunOptions.invocationMode = { kind: 'docker', ... }` runs the agent inside a Docker container. The adapter builds the CLI args as usual; the invocation mode wraps them with `docker run`.

## Quickstart

```ts
await client.run({
  agent: 'claude',
  prompt: 'Summarize this repo',
  invocationMode: {
    kind: 'docker',
    image: 'ghcr.io/a5c-ai/adapters-runtime:latest',
    mounts: [{ host: process.cwd(), container: '/workspace' }],
    env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY! },
    workdir: '/workspace',
  },
});
```

Or via CLI:

```bash
adapters run claude \
  --mode docker \
  --image ghcr.io/a5c-ai/adapters-runtime:latest \
  --mount "$PWD:/workspace" \
  --prompt "Hello"
```

## What the invocation mode adds

The resulting command looks like:

```
docker run --rm -i \
  -v <host>:<container> \
  -e ANTHROPIC_API_KEY=... \
  -w /workspace \
  <image> \
  claude --output-format jsonl --prompt "Hello"
```

## With `adapters-remote`

You can also nest `adapters` itself:

```ts
await client.run({
  agent: 'adapters-remote',
  prompt: 'Hello',
  invocationMode: { kind: 'docker', image: 'my/adapters:latest' },
  env: { AMUX_REMOTE_AGENT: 'claude' },
});
```

This runs `adapters run --json --agent claude --prompt ...` inside the container, and streams events back.

## Tips

- Use a dedicated image that pre-installs the target agent CLI.
- Pass secrets via `-e` or Docker secrets, not baked into the image.
- Session files stay **inside the container** unless you mount the agent's session dir to the host.

See [Invocation Modes](../reference/13-invocation-modes.md) for the full option surface.
