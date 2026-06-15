# @a5c-ai/genty-ui

Shared client, store, hooks, protocol types, realtime session-flow projection helpers, and cross-surface UI primitives for `adapters`.

## Install

```bash
npm install @a5c-ai/genty-ui react react-dom react-native react-native-web
```

## Usage

```ts
import {
  GatewayClient,
  GatewayProvider,
  SessionFlowView,
  useGateway,
  useSession,
} from "@a5c-ai/genty-ui";
```

Use the root entrypoint for the shared client, store, hooks, themes, primitives, and screen components.
Use the explicit public subpaths for release-stable consumer seams:

- `@a5c-ai/genty-ui/gateway`
- `@a5c-ai/genty-ui/protocol`
- `@a5c-ai/genty-ui/session-flow`

For realtime session execution views, import the dedicated projection surface from `./session-flow`:

```ts
import {
  buildSessionFilesFromTranscript,
  buildSessionFlowModel,
  buildSessionTimelineFromTranscript,
  buildSessionTranscript,
  buildAgentFlowLanes,
  projectRunFlow,
} from "@a5c-ai/genty-ui/session-flow";
```

Browser-consumer setup:

```ts
import "@a5c-ai/compendium/css";

import { GatewayClient, GatewayProvider } from "@a5c-ai/genty-ui";
import { buildSessionFlowModel } from "@a5c-ai/genty-ui/session-flow";
```

`@a5c-ai/genty-ui` does **not** ship a package CSS entrypoint. Browser apps such as `@a5c-ai/genty-web-app` own their app CSS and any external design-system CSS they choose to use.

The public surface currently includes:

- gateway protocol types plus `GatewayClient`
- gateway store creation and selectors
- React hooks for agents, sessions, runs, hook requests, connection state, and cost totals
- shared primitives and higher-level screens used by browser and React Native surfaces
- themed exports plus the `./gateway`, `./protocol`, and `./session-flow` subpath exports
- session-flow fallback helpers that derive timeline and file-attention views from transcript nodes when a consumer needs a native-message fallback

`./session-flow` is the shared projection seam used by package-level session detail surfaces. It turns gateway run records plus live event buffers into:

- per-run flow lanes and segments
- an ordered timeline across runs
- transcript nodes reconstructed from the same event stream
- file-attention summaries showing read/write/touch activity
- aggregate session summary counts and cost totals

It also exposes transcript-derived fallback helpers so consumers can keep native-session recovery logic in the shared package instead of re-implementing timeline/file derivation locally.

Intended audience and boundary:

- use `@a5c-ai/genty-ui/session-flow` when a surface needs a reusable realtime execution model
- keep product-specific routing, layout, page composition, and browser-only deep links in consuming apps such as `@a5c-ai/genty-web-app`
- do not treat this package as the owner of app-specific session pages or kanban workflow policy

## Validation

```bash
npm run build:realtime --workspace=@a5c-ai/genty-ui
npm run test --workspace=@a5c-ai/genty-ui
npm run test:realtime --workspace=@a5c-ai/genty-ui
npm run verify:release --workspace=@a5c-ai/genty-ui
npm run verify:metadata
npm pack --json --dry-run --workspace=@a5c-ai/genty-ui
```

For export-surface parity, confirm that `package.json#exports` still includes `./session-flow` and that the dry-run tarball contains the built `dist/session-flow.*` artifacts.

## Release Expectations

`@a5c-ai/genty-ui` is a public shared package. Keep this README aligned with the exported client/store/hooks/session-flow surface and keep `package.json#files` limited to built artifacts plus package docs.
