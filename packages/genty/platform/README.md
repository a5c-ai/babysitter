# @a5c-ai/genty-platform

Agent Platform layer — harness integration, governance, interaction, storage.

<!-- docs-status:start -->
> Status: Public advanced/runtime package.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README is the canonical runtime/platform API contract. The product CLI implementation lives in `@a5c-ai/genty`.
<!-- docs-status:end -->

## Installation

```bash
npm install @a5c-ai/genty-platform
```

## Usage

Use this package as the reusable platform API layer. Install `@a5c-ai/genty` for the product CLI.

```ts
import { discoverHarnesses, invokeHarness } from "@a5c-ai/genty-platform/harness";
import { apiRunStatus } from "@a5c-ai/genty-platform/api";
```

Use `@a5c-ai/genty` for the product CLI and the main `babysitter` CLI for harness installation and session-state commands:

```bash
babysitter harness:install claude-code
babysitter harness:install-plugin claude-code
babysitter session:state --session-id demo --state-dir .a5c
```

### Git worktree helpers (`/harness`)

`createWorktree`, `removeWorktree`, `listWorktrees`, and `isInsideWorktree` invoke
`git` directly with a structured argument vector and never build a shell command
string, so caller-supplied branch names and filesystem paths cannot inject
commands. Paths and revisions are passed after `--`, which makes leading-dash
values operands rather than git options.

The injected executor used for testing follows the same contract — it receives an
executable name plus an argument array, never a shell string, and must not enable
a shell:

```ts
import {
  createWorktree,
  listWorktrees,
  removeWorktree,
  type WorktreeExecFn,
} from "@a5c-ai/genty-platform/harness";

// Default behaviour: execFileSync("git", [...], { shell: false }).
createWorktree("/repo", {
  baseBranch: "main",
  worktreePath: "/tmp/my worktree",
  label: "parallel-task",
});

// Injected executor for tests — (file, args, options), never a command string.
const exec: WorktreeExecFn = (file, args, options) => {
  // file === "git", args === ["worktree", "add", "--", "<path>", "<branch>"]
  return Buffer.from("");
};
listWorktrees("/repo", exec);
removeWorktree("/tmp/my worktree", exec);
```

`ExecSyncFn` remains exported as a deprecated alias of `WorktreeExecFn`. The old
shell-command-string executor shape is no longer accepted.

## Local Build

From the repo root, run:

```bash
npm run build --workspace=@a5c-ai/genty-platform
```

This package now builds with `tsc --build` project references for workspace-owned TypeScript packages, and it explicitly invokes the root `build:runtime:agent-platform-deps` entrypoint to prepare the runtime chain, including the `@a5c-ai/adapters` SDK surface. A fresh-checkout build no longer requires prebuilt upstream `dist/` output.

For the release/CI runtime chain, use the shared root entrypoint:

```bash
npm run build:runtime
```
