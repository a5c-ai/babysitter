# Kubernetes Invocation Mode

`RunOptions.invocationMode = { kind: 'k8s', ... }` runs the agent inside a Kubernetes pod, exec'ing into a container you control.

## Quickstart

```ts
await client.run({
  agent: 'claude',
  prompt: 'Run the suite',
  invocationMode: {
    kind: 'k8s',
    namespace: 'agents',
    pod: 'amux-runner-0',
    container: 'runner',
  },
});
```

Or via CLI:

```bash
amux run claude \
  --mode k8s \
  --namespace agents \
  --pod amux-runner-0 \
  --container runner \
  --prompt "Hello"
```

Under the hood this becomes:

```
kubectl exec -n agents amux-runner-0 -c runner -i -- \
  claude --output-format jsonl --prompt "Hello"
```

## Ephemeral pods

To create a one-shot pod from an image, use `kind: 'k8s'` with `create: true`:

```ts
invocationMode: {
  kind: 'k8s',
  namespace: 'agents',
  create: true,
  image: 'ghcr.io/a5c-ai/amux-runtime:latest',
  env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY! },
}
```

The run handle will delete the pod on completion.

## Remote agent pattern

Combine with the `agent-mux-remote` adapter to host many agents behind one pod template:

```ts
await client.run({
  agent: 'agent-mux-remote',
  prompt: 'Hello',
  invocationMode: { kind: 'k8s', namespace: 'agents', pod: 'amux-0' },
  env: { AMUX_REMOTE_AGENT: 'claude' },
});
```

## Prereqs

- `kubectl` on `PATH` with a context that can `exec` into the target namespace.
- The pod's container image must include the target agent CLI (or `amux` when using `agent-mux-remote`).

See [Invocation Modes](../reference/13-invocation-modes.md).
