# @a5c-ai/agent-mux-webui

Browser application package for `agent-mux` gateway control, monitoring, and realtime session-detail inspection.

## Install

```bash
npm install @a5c-ai/agent-mux-webui
```

In this monorepo, local development is driven with:

```bash
npm run build --workspace=@a5c-ai/agent-mux-webui
```

## Package Surface

This package is published as an application bundle, not as a general-purpose library. The published tarball is expected to contain:

- `dist/` for the built browser app
- `dist-types/` for generated declaration output
- `public/` for packaged static assets
- this package README and `LICENSE`

There is no standalone CLI binary in this package. The public surface is the packaged web app and its build artifacts.

The packaged app now includes a session-detail realtime view that reconstructs execution from live gateway event buffers. In that surface, consumers can inspect:

- per-run flow lanes and segment status
- merged session timeline activity
- reconstructed transcript turns
- file-attention summaries derived from tool and message events

That view is implemented on top of the shared `@a5c-ai/agent-mux-ui/session-flow` export, but this package itself remains an application bundle rather than a reusable API package.

This package is also the consumer-validation surface for the shared realtime session-flow API. Its session-detail code is expected to import the public `@a5c-ai/agent-mux-ui/session-flow` seam directly rather than rely on package-local shims.

Setup boundary:

- `@a5c-ai/agent-mux-ui` provides the shared client, hooks, and session-flow primitives.
- `@a5c-ai/agent-mux-webui` owns browser routing, app layout, browser-only deep links, and CSS.
- Browser styling remains app-local here; the app imports `@a5c-ai/compendium/css` plus its own `src/styles/global.css`.

## Validation

```bash
npm run build:realtime --workspace=@a5c-ai/agent-mux-webui
npm run test --workspace=@a5c-ai/agent-mux-webui
npm run test:realtime --workspace=@a5c-ai/agent-mux-webui
npm run verify:release --workspace=@a5c-ai/agent-mux-webui
npm run verify:metadata
npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-webui
```

For release review, verify that the built app still includes the session-detail realtime flow surface and that the tarball only ships the documented app assets in `package.json#files`.

## Release Expectations

`@a5c-ai/agent-mux-webui` is part of the central `agent-mux` release set. Keep this README aligned with the packaged app surface, including the session-detail realtime view, and update `package.json#files` whenever the shipped app layout changes.
