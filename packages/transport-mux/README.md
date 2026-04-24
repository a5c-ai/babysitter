# transport-mux

`transport-mux` is the current JS/Node runtime package behind the `amux-proxy` binary.

## Runtime path

The live control-plane path in this repo is:

1. `packages/agent-mux/cli/src/commands/launch.ts` decides whether a proxy is needed and spawns `amux-proxy`.
2. `packages/agent-mux/core/src/provider-resolver.ts` resolves canonical provider config.
3. `packages/agent-mux/adapters/src/translate-for-harness.ts` chooses the harness-facing protocol contract.
4. `packages/transport-mux` accepts the exposed protocol, executes the provider call, and renders the response back in that protocol.

## Package facts

- npm package: `@a5c-ai/transport-mux`
- installed binary: `amux-proxy`
- runtime: Node `>=20.9.0`
- HTTP framework: `hono`

## Stable contract

This package keeps the external proxy boundary stable:

- `amux-proxy` remains the binary name
- `AMUX_PROXY_*` remains the env contract
- `amux launch --with-proxy-if-needed` remains the control-plane entrypoint
- `GET /health` and `GET /v1/models` remain open
- protocol routes remain proxy-token protected through `x-api-key` or bearer auth

The package is described in terms of two internal layers:

- a protocol layer that owns inbound route mounting, request decoding, auth at the proxy boundary, and protocol-native response shaping
- a provider layer that owns upstream auth injection, endpoint resolution, request mapping, stream parsing, model discovery, and token-count behavior

## Operator checks

Use the real workspace gates when touching this package:

```bash
npm run build --workspace=@a5c-ai/transport-mux
npm run test --workspace=@a5c-ai/transport-mux
npm run build:agent-mux
npm run test:agent-mux
```

Those commands prove both sides of the active path:

- the transport-mux package surface builds and satisfies its test-backed route/config contract
- the agent-mux launcher path still resolves providers, selects harness transports, and spawns `amux-proxy`

## Current document set

- [Architecture](./architecture.md): protocol/provider boundaries and route contract
- [Migration Closure](./migration.md): bounded closure criteria for docs, launcher, publish, CI, and legacy surface retirement
