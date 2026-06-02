# @a5c-ai/agent-mux-extensions

Cross-harness plugin compiler for converting a unified `plugin.json` source tree into harness-specific plugin packages.

## Install

```bash
npm install @a5c-ai/agent-mux-extensions
```

CLI usage:

```bash
npx --yes @a5c-ai/agent-mux-extensions --help
```

This package ships the built compiler in `dist/` and this package README for npm auditability.

## CLI Surface

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
} from "@a5c-ai/agent-mux-extensions";
```

The package exports the compiler pipeline and related types:

- manifest schema and package types
- directory validation, target resolution, transform, emit, and verify helpers
- target registry accessors and compilation entrypoints

## Validation

```bash
npm run build --workspace=@a5c-ai/agent-mux-extensions
npm run test --workspace=@a5c-ai/agent-mux-extensions
npm run verify:metadata
npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-extensions
```

## Release Expectations

`@a5c-ai/agent-mux-extensions` is published from the central release workflows. Keep this README aligned with the actual command set and compiler exports, and keep `package.json#files` limited to the built compiler plus package documentation.
