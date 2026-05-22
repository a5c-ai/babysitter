# @a5c-ai/agent-mux-observability

Structured logging and telemetry primitives for `agent-mux`.

## Install

```bash
npm install @a5c-ai/agent-mux-observability
```

## Usage

```ts
import {
  createComponentLogger,
  initializeTelemetry,
  shutdownTelemetry,
} from "@a5c-ai/agent-mux-observability";
```

The public surface includes:

- `logger`, `createLogger`, `createComponentLogger`, and `reconfigureLogger`
- `telemetry`, `initializeObservability`, `shutdownObservability`
- compatibility exports `initializeTelemetry` and `shutdownTelemetry`
- the shared logger and telemetry types

Runtime mode is selected with `AMUX_OBSERVABILITY_MODE=full|simple`.

## Validation

```bash
npm run build --workspace=@a5c-ai/agent-mux-observability
npm run test --workspace=@a5c-ai/agent-mux-observability
npm run verify:metadata
npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-observability
```

## Release Expectations

This is a public package in the central `agent-mux` release set. Keep the README aligned with the exported logging and telemetry seams, and keep the publish surface constrained to `dist/` plus package documentation.
