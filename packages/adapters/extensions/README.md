# @a5c-ai/extensions-adapter

Cross-harness plugin compiler for converting a unified `plugin.json` source tree into harness-specific plugin packages.

## Install

```bash
npm install @a5c-ai/extensions-adapter
```

> **Pin an explicit version until the recovery release lands.** As of the
> 2026-08-13 registry snapshot, `latest` for this package still resolves to
> `6.0.0`, whose tarball ships only `package.json` and this README — no `dist/`,
> so neither bin works (FIX-004). The repaired artifact ships in the recovery
> release; the unversioned command above resolves a working artifact only once
> `latest` has been promoted to it. See
> [docs/release-incident-2026-08-13.md](../../../docs/release-incident-2026-08-13.md)
> and [docs/release-recovery-runbook.md](../../../docs/release-recovery-runbook.md).
> Delete this note once the promotion has been verified against the registry.

CLI usage:

```bash
npx --yes @a5c-ai/extensions-adapter --help
```

This package ships the built compiler in `dist/` and this package README for npm auditability.

## CLI Surface

The package publishes two bin names:

| Bin | Target | Status |
| --- | --- | --- |
| `adapters-extensions` | `dist/cli.js` | Canonical |
| `extensions-adapter` | `dist/extension-adapter.js` | Deprecated compatibility alias |

`extensions-adapter` prints `[adapters] "extensions-adapter" is deprecated, use "adapters-extensions" instead.` on stderr and returns the exit code delegated by the canonical CLI. Its source is `src/extension-adapter.ts` (singular); `dist/extension-adapter.js` is the file `tsc` emits from it, and `scripts/check-binary-renames.cjs` enforces that the declared bin target matches that emitted path.

The current public CLI commands are:

- `compile --target <name|all> --output <dir>` to emit target plugin surfaces
- `validate --source <dir>` to validate a unified plugin directory without writing output
- `init --name <name> [--template <minimal|full|hooks-only>] [--output <dir>]` to scaffold a valid unified plugin source tree
- `list-targets` to print the supported target registry

The `diff` command is still reserved and currently exits with a not-implemented error. The supported targets are `claude-code`, `codex`, `cursor`, `gemini`, `github-copilot`, `pi`, `oh-my-pi`, `opencode`, and `openclaw`.

## API Surface

```ts
import {
  compile,
  compileAll,
  validateDirectory,
  validateSchema,
} from "@a5c-ai/extensions-adapter";
```

The package exports the compiler pipeline and related types:

- manifest schema and package types
- directory validation, target resolution, transform, emit, and verify helpers
- target registry accessors and compilation entrypoints

## Validation

```bash
npm run build --workspace=@a5c-ai/extensions-adapter
npm run test --workspace=@a5c-ai/extensions-adapter
npm run verify:release --workspace=@a5c-ai/extensions-adapter
npm run test:packaged-surface-parity --workspace=@a5c-ai/extensions-adapter
npm run verify:metadata
npm run test:binary-renames
npm pack --json --dry-run --workspace=@a5c-ai/extensions-adapter
```

## Release Expectations

`@a5c-ai/extensions-adapter` is published from the central release workflows. Keep this README aligned with the actual command set and compiler exports, and keep `package.json#files` limited to the built compiler plus package documentation.

The release workflows build this workspace before invoking the lifecycle-disabled publish helper, and `scripts/publish-package-from-tag.mjs` runs `npm run verify:release` for this package immediately before `npm publish`. That gate fails when `dist/` is missing or stale, when either bin target is absent, or when the compatibility bin stops delegating its exit code — so the package cannot be published without its build output. `npm run test:packaged-surface-parity` proves the same properties against the exact packed tarball installed into a clean temporary consumer (it delegates to the generic release verifier, `scripts/verify-release-artifacts.mjs`).
