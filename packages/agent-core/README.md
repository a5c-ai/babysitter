# @a5c-ai/agent-core

Built-in programmatic runtime and agentic tool surface for Babysitter.

## Local Build

From the repo root, run:

```bash
npm run build --workspace=@a5c-ai/agent-core
```

This package now builds with `tsc --build` project references for workspace-owned TypeScript packages, and it explicitly invokes the root `build:runtime:agent-core-deps` entrypoint to prepare the `@a5c-ai/agent-mux` SDK surface. A fresh-checkout build no longer depends on prebuilt upstream `dist/` output.

For the full runtime chain used in CI and releases, run:

```bash
npm run build:runtime
```
