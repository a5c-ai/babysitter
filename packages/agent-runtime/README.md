# @a5c-ai/agent-runtime

Agent runtime layer (L5) for the Babysitter monorepo.

Provides daemon lifecycle, session management, resource management, and telemetry infrastructure.

The runtime observability surface includes compatible daemon JSONL logging policy
helpers, run-health latency percentiles, pure diagnostics renderers for health,
metrics, config, and queue state, and optional telemetry trace/export helpers.
Remote telemetry exporters are opt-in; local and no-op behavior remains the
default.

## Install

```bash
npm install @a5c-ai/agent-runtime
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```
