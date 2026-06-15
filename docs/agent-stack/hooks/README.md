# Agent Stack Hooks — Gap Analysis & Specs

Claude Code defines 30 hook events. The atlas graph and hooks-adapter canonical contract cover all 30, and adapters now registers native Claude runtime hooks for the concrete events that have a runtime source. This directory documents remaining SDK/platform emission gaps and specs for full parity.

## Documents

1. [**coverage-matrix.md**](./coverage-matrix.md) — Full 30-event coverage matrix across atlas, hooks-adapter, adapters runtime, SDK, and remaining platform surfaces
2. [**missing-events.md**](./missing-events.md) — Specs for remaining runtime-emission gaps
3. [**missing-capabilities.md**](./missing-capabilities.md) — Handler types, decisions, matchers, async, env vars gaps
