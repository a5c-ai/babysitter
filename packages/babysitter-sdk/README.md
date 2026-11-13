# @a5c-ai/babysitter-sdk

Core runtime, storage, task, plugin, MCP, and CLI primitives for Babysitter.

## Install

```bash
npm install @a5c-ai/babysitter-sdk
```

Optional breakpoint routing support:

```bash
npm install @a5c-ai/tasks-adapter
```

This package ships the built runtime in `dist/`, bundled command/skill templates in `skills/`, and this package README for npm auditability.

## CLI Surface

The package exposes three binaries:

```bash
npm exec --yes --package @a5c-ai/babysitter-sdk@latest -- babysitter --help
npm exec --yes --package @a5c-ai/babysitter-sdk@latest -- babysitter-sdk --help
npm exec --yes --package @a5c-ai/babysitter-sdk@latest -- babysitter-mcp-server --help
```

`babysitter` and `babysitter-sdk` point at the same CLI entrypoint. The public command groups currently include:

- `run:*`, `task:*`, and `session:*` for run orchestration and task result posting
- `skill:*`, `harness:*`, and `plugin:*` for discovery, installation, and registry flows
- `process-library:*`, `profile:*`, and `instructions:*` for library/profile management and generated guidance
- `tokens:*`, `compression:*`, `log`, `hook:*`, `health`, `configure`, and `version` for operator workflows

The optional interactive runtime commands such as `create-run`, `resume-run`, `plan`, `yolo`, `observe`, and `tui` live in the separate `@a5c-ai/genty-platform` package.

### Non-interactive breakpoint gates

In `run:create --non-interactive` runs, breakpoints with an `expert` or a `destructive`, `destroy`, or `approval-gate` tag return `{ approved: false, deferred: true }` by default. Other breakpoints retain automatic approval. Use `--allow-auto-approve-owner-gates` only when the run is explicitly allowed to approve those gates; the equivalent API metadata is `nonInteractiveOwnerGates: "approve"`.

At launch, the SDK parses the exported process function and checks direct breakpoint calls on its context parameter, including renamed parameters. It refuses protected gates and direct calls with dynamic routing options before writing the run directory or journal. For gates declared outside that entrypoint, pass `--breakpoint-declarations gates.json` with an array such as `[{"breakpointId":"deploy.owner","expert":"owner"}]`; the API equivalent is `createRun({ breakpointDeclarations: [...] })`. Breakpoints selected inside imported helpers cannot always be discovered at launch; the runtime policy still checks them when reached.

## API Surface

```ts
import {
  createRun,
  defineTask,
  createBabysitterMcpServer,
} from "@a5c-ai/babysitter-sdk";
```

The root export surface currently re-exports these modules:

- runtime, runtime types, storage, storage types, tasks, testing
- CLI arg parsing helpers and command entrypoint helpers
- hooks, harness, breakpoints, MCP, plugins, prompts, logging, cost, config, profiles
- session helpers, process-library helpers, and compression utilities

## Validation

```bash
npm run lint --workspace=@a5c-ai/babysitter-sdk
npm run build --workspace=@a5c-ai/babysitter-sdk
npm run test --workspace=@a5c-ai/babysitter-sdk
npm run smoke:cli --workspace=@a5c-ai/babysitter-sdk
npm run verify:package-health --workspace=@a5c-ai/babysitter-sdk
npm run verify:metadata
npm pack --json --dry-run --workspace=@a5c-ai/babysitter-sdk
```

## Release Expectations

`@a5c-ai/babysitter-sdk` is a centrally released public package. Keep this README aligned with the actual CLI/API surface, keep `package.json#files` aligned with what ships, and verify the package health guard plus dry-run tarball before changing release-facing behavior.
