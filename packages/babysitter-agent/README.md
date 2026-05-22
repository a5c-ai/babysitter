# @a5c-ai/babysitter-agent

Optional CLI package for Babysitter agent runtime commands.

<!-- docs-status:start -->
> Status: Public advanced/runtime package.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README is the canonical runtime CLI contract for operator-facing `babysitter-agent` workflows.
<!-- docs-status:end -->

## Installation

```bash
npm install -g @a5c-ai/babysitter-agent
```

## Usage

This package provides the `babysitter-agent` command. Use it for runtime orchestration.

```bash
babysitter-agent --help
babysitter-agent call --harness claude-code --prompt "implement feature X" --workspace .
babysitter session:init --session-id demo --state-dir .a5c --run-id run-123
babysitter-agent start-server --transport stdio
babysitter-agent discover --json
babysitter-agent invoke claude-code --prompt "implement feature X" --workspace .
babysitter-agent tui --workspace .
```

Use the main `babysitter` CLI for harness installation and session-state commands:

```bash
babysitter harness:install claude-code
babysitter harness:install-plugin claude-code
babysitter session:state --session-id demo --state-dir .a5c
```

## Local Build

From the repo root, run:

```bash
npm run build --workspace=@a5c-ai/babysitter-agent
```

This package now builds with `tsc --build` project references for workspace-owned TypeScript packages, and it explicitly invokes the root `build:runtime:babysitter-agent-deps` entrypoint to prepare the runtime chain, including the `@a5c-ai/agent-mux` SDK surface. A fresh-checkout build no longer requires prebuilt upstream `dist/` output.

For the release/CI runtime chain, use the shared root entrypoint:

```bash
npm run build:runtime
```
