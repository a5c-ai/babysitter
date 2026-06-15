# @a5c-ai/adapters-observability

Structured logging and telemetry primitives for `adapters`.

## Install

```bash
npm install @a5c-ai/adapters-observability
```

## Usage

```ts
import {
  createComponentLogger,
  initializeTelemetry,
  shutdownTelemetry,
} from "@a5c-ai/adapters-observability";
```

The public surface includes:

- `logger`, `createLogger`, `createComponentLogger`, and `reconfigureLogger`
- `telemetry`, `initializeObservability`, `shutdownObservability`
- compatibility exports `initializeTelemetry` and `shutdownTelemetry`
- the shared logger and telemetry types

Runtime mode is selected with `AGENT_MUX_OBSERVABILITY_MODE=full|simple`.

## Validation

```bash
npm run build --workspace=@a5c-ai/adapters-observability
npm run test --workspace=@a5c-ai/adapters-observability
npm run verify:metadata
npm pack --json --dry-run --workspace=@a5c-ai/adapters-observability
```

## Release Expectations

This is a public package in the central `adapters` release set. Keep the README aligned with the exported logging and telemetry seams, and keep the publish surface constrained to `dist/` plus package documentation.
