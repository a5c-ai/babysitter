# @a5c-ai/tula-platform

Agent Platform layer — harness integration, governance, interaction, storage.

<!-- docs-status:start -->
> Status: Public advanced/runtime package.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README is the canonical runtime/platform API contract. The product CLI implementation lives in `@a5c-ai/tula`.
<!-- docs-status:end -->

## Installation

```bash
npm install @a5c-ai/tula-platform
```

## Usage

Use this package as the reusable platform API layer. Install `@a5c-ai/tula` for the product CLI.

```ts
import { discoverHarnesses, invokeHarness } from "@a5c-ai/tula-platform/harness";
import { apiRunStatus } from "@a5c-ai/tula-platform/api";
```

Use `@a5c-ai/tula` for the product CLI and the main `babysitter` CLI for harness installation and session-state commands:

```bash
babysitter harness:install claude-code
babysitter harness:install-plugin claude-code
babysitter session:state --session-id demo --state-dir .a5c
```

## Local Build

From the repo root, run:

```bash
npm run build --workspace=@a5c-ai/tula-platform
```

This package now builds with `tsc --build` project references for workspace-owned TypeScript packages, and it explicitly invokes the root `build:runtime:agent-platform-deps` entrypoint to prepare the runtime chain, including the `@a5c-ai/agent-mux` SDK surface. A fresh-checkout build no longer requires prebuilt upstream `dist/` output.

For the release/CI runtime chain, use the shared root entrypoint:

```bash
npm run build:runtime
```
