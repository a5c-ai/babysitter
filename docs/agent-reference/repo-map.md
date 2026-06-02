# Repo Map

This is the short orientation guide for the Babysitter monorepo.

## High-Value Commands

Source of truth: [`package.json`](../../package.json).

```bash
npm run build:sdk
npm run test:sdk
npm run verify:metadata
npm run build:hooks-mux
npm run test:hooks-mux
npm run lint:hooks-mux
```

## Core Packages

| Path | Package | Role |
| --- | --- | --- |
| `packages/sdk` | `@a5c-ai/babysitter-sdk` | Core runtime, storage, tasks, CLI, hooks, profiles, plugins, compression |
| `packages/babysitter` | `@a5c-ai/babysitter` | Metapackage and `babysitter` binary |
| `packages/agent-platform` | `@a5c-ai/agent-platform` | Platform API for harness integration, governance, interaction, and storage |
| `packages/tula` | `@a5c-ai/tula` | Unified product package and owner of the `tula` CLI implementation |
| `packages/babysitter-tui-plugins` | `@a5c-ai/babysitter-tui-plugins` | TUI panels for status, cost, and governance |
| `packages/atlas` | `@a5c-ai/atlas` | Atlas catalog graph SDK, CLI, and data |
| `packages/atlas/webui` | `@a5c-ai/atlas-webui` | Atlas graph explorer (Next.js) |
| `packages/agent-mux/hooks/*` | `hooks-mux workspace packages` | Hook normalization, CLI, and harness adapters |

## Key Entry Points

- SDK CLI: [`packages/sdk/src/cli/main.ts`](../../packages/sdk/src/cli/main.ts)
- SDK command registry: [`packages/sdk/src/cli/main/program.ts`](../../packages/sdk/src/cli/main/program.ts)
- SDK config and runs resolution: [`packages/sdk/src/config/`](../../packages/sdk/src/config)
- Tula product CLI: [`packages/tula/src/cli/main.ts`](../../packages/tula/src/cli/main.ts)
- Metapackage shim: `packages/babysitter/bin/babysitter.js`
- Atlas graph explorer: [`packages/atlas/webui/app/page.tsx`](../../packages/atlas/webui/app/page.tsx)

## Repo Conventions

- Import workspace packages by package name, never cross-package relative paths.
- Keep event-sourced state transitions inside the SDK runtime and storage layers.
- Prefer co-located tests in `__tests__/` with `*.test.ts`.
- Unused variables should use `_` prefixes where needed for ESLint.
