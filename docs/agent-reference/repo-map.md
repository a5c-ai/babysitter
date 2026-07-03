# Repo Map

This is the short orientation guide for the Babysitter monorepo.

## High-Value Commands

Source of truth: [`package.json`](../../package.json).

```bash
npm run build:sdk
npm run test:sdk
npm run verify:metadata
npm run build:hooks-adapter
npm run test:hooks-adapter
npm run lint:hooks-adapter
```

## Core Packages

| Path | Package | Role |
| --- | --- | --- |
| `packages/babysitter-sdk` | `@a5c-ai/babysitter-sdk` | Core runtime, storage, tasks, CLI, hooks, profiles, plugins, compression |
| `packages/babysitter` | `@a5c-ai/babysitter` | Metapackage and `babysitter` binary |
| `packages/genty/platform` | `@a5c-ai/genty-platform` | Platform API for harness integration, governance, interaction, and storage |
| `packages/genty` | `@a5c-ai/genty` | Unified product package and owner of the `genty` CLI implementation |
| `packages/genty/tui-plugins` | `@a5c-ai/genty-tui-plugins` | TUI panels for status, cost, and governance |
| `packages/atlas` | `@a5c-ai/atlas` | Atlas catalog graph SDK, CLI, and data |
| `packages/atlas/webui` | `@a5c-ai/atlas-webui` | Atlas graph explorer (Next.js) |
| `packages/adapters/hooks/*` | `hooks-adapter workspace packages` | Hook normalization, CLI, and harness adapters |
| `packages/adapters/policy` | `@a5c-ai/policy-adapter` | Proof-based policy enforcement trust core: unified signed envelopes, trusted-store key resolution, config-integrity manifest, policy schema + evaluator, `CommandAuthorization` issuance, argv matcher, and the tool-layer enforcement gates |

## Policy Enforcement (proof-based)

The cryptographic policy-enforcement layer (Milestones A–E) lets a command run only when a
declarative policy's required trust chain of signed evidence is satisfied. Enforcement is
toggled off-workspace by the pinned `POLICY_CONFIG_ROOT_FP` anchor; unpinned = back-compat
pass-through, pinned = active + fail-closed.

- Overview + config + schema + gates + runbook: [`docs/policy-enforcement.md`](../policy-enforcement.md)
- Authoritative design spec: [`docs/design/proof-based-policy-enforcement.md`](../design/proof-based-policy-enforcement.md)
- Package: [`packages/adapters/policy`](../../packages/adapters/policy) (`@a5c-ai/policy-adapter`), worked example configs under [`packages/adapters/policy/examples`](../../packages/adapters/policy/examples).
- Trust primitives: [`packages/genty/core/src/trust`](../../packages/genty/core/src/trust) (`SignedEnvelope`, model-decision + in-process attestation, chain, signing).
- Enforcement surfaces: GATE 1 [`packages/adapters/tools/src/policy-verifier-wiring.ts`](../../packages/adapters/tools/src/policy-verifier-wiring.ts); genty session/MCP gates [`packages/genty/platform/src/harness/internal/createRun/orchestration/policy-enforcement-wiring.ts`](../../packages/genty/platform/src/harness/internal/createRun/orchestration/policy-enforcement-wiring.ts); GATE 3 credential backstop [`packages/adapters/core/src/policy-spawn-gate.ts`](../../packages/adapters/core/src/policy-spawn-gate.ts) + [`spawn-invocation.ts`](../../packages/adapters/core/src/spawn-invocation.ts); proxy attestation [`packages/adapters/transport/src/attestation.ts`](../../packages/adapters/transport/src/attestation.ts); SDK signed-breakpoint gate [`packages/babysitter-sdk/src/breakpoints/`](../../packages/babysitter-sdk/src/breakpoints).

## Key Entry Points

- SDK CLI: [`packages/babysitter-sdk/src/cli/main.ts`](../../packages/babysitter-sdk/src/cli/main.ts)
- SDK command registry: [`packages/babysitter-sdk/src/cli/main/program.ts`](../../packages/babysitter-sdk/src/cli/main/program.ts)
- SDK config and runs resolution: [`packages/babysitter-sdk/src/config/`](../../packages/babysitter-sdk/src/config)
- genty product CLI: [`packages/genty/src/cli/main.ts`](../../packages/genty/src/cli/main.ts)
- Metapackage shim: `packages/babysitter/bin/babysitter.js`
- Atlas graph explorer: [`packages/atlas/webui/app/page.tsx`](../../packages/atlas/webui/app/page.tsx)

## Repo Conventions

- Import workspace packages by package name, never cross-package relative paths.
- Keep event-sourced state transitions inside the SDK runtime and storage layers.
- Prefer co-located tests in `__tests__/` with `*.test.ts`.
- Unused variables should use `_` prefixes where needed for ESLint.
