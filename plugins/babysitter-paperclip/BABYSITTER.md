# Babysitter Paperclip Plugin

## Build

```bash
cd plugins/babysitter-paperclip
npm run build
```

Build uses esbuild (configured in `esbuild.config.mjs`). Output goes to `dist/`.

## Dev

```bash
cd plugins/babysitter-paperclip
npm run dev
```

Starts the Paperclip plugin dev server on port 4177 with hot reload for UI components.

## Test

```bash
cd plugins/babysitter-paperclip
npm run test
```

Uses vitest. Test files follow the `*.test.ts` convention in `__tests__/` directories.

## Key Files

| File | Role |
|------|------|
| `src/worker.ts` | Worker entry point -- event handlers, data handlers, action handlers, stream handler, tool registration |
| `src/manifest.ts` | Plugin manifest -- capabilities, event subscriptions, UI slots, settings schema |
| `src/babysitter-bridge.ts` | CLI bridge -- typed wrappers around `babysitter` CLI commands (`run:create`, `run:iterate`, `task:post`, etc.) |
| `src/delegating-adapter.ts` | Harness detection -- three-tier detection of underlying AI harness from Paperclip agent metadata |
| `src/types.ts` | Shared types -- `TrackedRun`, `PendingBreakpoint`, `RunsOverview`, `RunDetail`, `HarnessDetectionResult`, `ADAPTER_TYPE_MAP` |
| `src/ui/` | React UI components -- `BabysitterDashboard`, `RunDetailTab`, `BreakpointApproval`, `BabysitterSidebar` |

## Dependencies

- `@paperclipai/plugin-sdk` (peer, >=0.1.0) -- Paperclip plugin SDK
- `@a5c-ai/babysitter-sdk` (workspace) -- Babysitter SDK for types and utilities
- `react` / `react-dom` (dev, ^19.0.0) -- UI component rendering
- `esbuild` (dev) -- Build tooling
