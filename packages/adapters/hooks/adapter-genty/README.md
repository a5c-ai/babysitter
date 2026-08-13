# @a5c-ai/hooks-adapter-genty

Genty harness adapter for hooks-adapter.

## Install

```bash
npm install @a5c-ai/hooks-adapter-genty @a5c-ai/hooks-adapter-core
```

> **Publication status: pending the recovery release.** This command does **not**
> work against npm yet. `@a5c-ai/hooks-adapter-genty` has never been published —
> it was absent from the build and release paths until FIX-005 wired it in (see
> [docs/release-incident-2026-08-13.md](../../../../docs/release-incident-2026-08-13.md)),
> and the first version will appear only with the recovery release described in
> [docs/release-recovery-runbook.md](../../../../docs/release-recovery-runbook.md).
> Until then, consume this package from the workspace
> (`npm run build --workspace=@a5c-ai/hooks-adapter-genty`). `@a5c-ai/hooks-adapter-cli`
> pins this package exactly, so the CLI is not installable from npm until this
> package publishes first. This note must be deleted once the install command has
> been verified against the registry.

This package ships the built adapter runtime in `dist/` and this package README for npm publish-surface auditing.

The package is part of the authoritative publishable-package inventory
(`scripts/lib/publishable-packages.cjs`) and joins the release workflows through
the `hooks-leaves` release-matrix group rather than any hand-maintained list; see
[docs/release-pipeline.md](../../../../docs/release-pipeline.md#package-inventory-and-release-matrices).

## Usage

```ts
import {
  createAdapter,
  normalizeGentyEvent,
  renderGentyOutput,
} from "@a5c-ai/hooks-adapter-genty";
```

The package exposes Genty-specific normalization, phase mappings, rendering helpers, and session-resolution utilities for the hooks-adapter execution pipeline.

See [`packages/adapters/hooks/README.md`](../README.md) for the workspace overview and `packages/adapters/hooks/docs/adapter-integration-guide.md` for end-to-end integration guidance.

## License

MIT © a5c-ai
