---
title: Babysitter CLI and SDK Examples
description: End-to-end examples for creating runs, iterating effects, and exercising the Babysitter SDK testing surface.
last_updated: 2026-04-26
---

# Babysitter CLI & SDK Examples

This guide walks through a realistic flow that exercises the `babysitter` CLI and the new deterministic test harness exposed from `@a5c-ai/babysitter-sdk/testing`. The examples assume you are standing in the repo root (or a project that already vendored the CLI + SDK) and that `~/.a5c/runs` is the default runs directory. Set `BABYSITTER_RUNS_SCOPE=repo` if you want repo-local `<repo>/.a5c/runs` instead.

> **Tip:** All CLI paths in this document are rendered with POSIX separators (matching the CLI output convention) even when running on Windows.

---

## 1. Create a run from a process entrypoint

```bash
babysitter run:create \
  --process-id dev/build \
  --entry processes/build/process.mjs#process \
  --inputs examples/inputs/build.json \
  --prompt "Build all workspace packages"
```

Typical JSON response (`--json`):

```json
{
  "runId": "run-20260112-130455",
  "runDir": "~/.a5c/runs/run-20260112-130455",
  "process": {
    "processId": "dev/build",
    "entry": "processes/build/process.mjs#process"
  }
}
```

---

## 1b. Assign a process to a bare run

When a run is created without `--entry` (a bare run), assign a process before iterating:

```bash
babysitter run:assign-process .a5c/runs/run-20260112-130455 \
  --entry processes/build/process.mjs#process \
  --process-id dev/build \
  --json
```

```json
{
  "runId": "run-20260112-130455",
  "runDir": ".a5c/runs/run-20260112-130455",
  "entry": "processes/build/process.mjs#process",
  "processId": "dev/build",
  "previousEntrypoint": { "importPath": "bare-run" },
  "assigned": true
}
```

---

## 2. Inspect run status

```bash
babysitter run:status run-20260112-130455 --json
```

```json
{
  "state": "waiting",
  "lastEvent": "RUN_CREATED#0001 2026-01-12T13:04:56.012Z",
  "pendingByKind": {
    "node": 2
  },
  "metadata": {
    "stateVersion": 1,
    "pendingEffectsByKind": {
      "node": 2
    }
  }
}
```

The CLI prints the same summary in human form when `--json` is omitted:

```
[run:status] state=waiting last=RUN_CREATED#0001 2026-01-12T13:04:56.012Z pending[node]=2 pending[total]=2 stateVersion=1
```

---

## 3. Discover pending effects

```bash
babysitter task:list run-20260112-130455 --pending
```

```
[task:list] pending=2
- ef-build-001 [node requested] build workspace (taskId=build.workspaces)
- ef-lint-001 [node requested] lint sources (taskId=lint.sources)
```

The JSON variant highlights the run-relative artifact refs (all `/` even on Windows):

```json
{
  "tasks": [
    {
      "effectId": "ef-build-001",
      "status": "requested",
      "kind": "node",
      "label": "build workspace",
      "taskDefRef": "tasks/ef-build-001/task.json",
      "resultRef": null,
      "stdoutRef": null,
      "stderrRef": null
    }
  ]
}
```

---

## 4. Inspect a specific effect

```bash
babysitter task:show run-20260112-130455 ef-build-001 --json
```

Key fields in the response:

```json
{
  "effect": {
    "effectId": "ef-build-001",
    "taskId": "build.workspaces",
    "status": "requested",
    "stdoutRef": null
  },
  "task": {
    "kind": "node",
    "node": {
      "entry": "build/scripts/build-workspace.mjs",
      "args": ["--workspace", "frontend"]
    }
  },
  "result": null,
  "largeResult": null
}
```

When `result.json` exceeds 1 MiB the CLI prints `result: see tasks/<id>/result.json` instead of dumping the payload.

---

## 5. Dry-run a task result post

```bash
babysitter task:post run-20260112-130455 ef-build-001 --status ok --dry-run
```

```
[task:post] status=skipped
```

Dry runs preview the mutation and exit `0` without changing on-disk state.

---

## 6. Drive a run without built-in auto-execution

Instead of `run:continue` (removed), loop `run:iterate`, execute pending effects using your own runner (hook/worker/agent), then commit results with `task:post`.

---

## 7. Unit-test a process with the deterministic harness

The SDK now exports `runToCompletionWithFakeRunner` from `@a5c-ai/babysitter-sdk/testing`. Use it to exercise process logic without invoking real node runners:

```ts
import { runToCompletionWithFakeRunner } from "@a5c-ai/babysitter-sdk/testing";
import { createRun } from "@a5c-ai/babysitter-sdk";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

test("build pipeline converges", async () => {
  const runsDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-tests-"));
  const { runDir } = await createRun({
    runsDir,
    process: {
      processId: "dev/build",
      importPath: "../processes/build/process.mjs",
      exportName: "process",
    },
    inputs: { branch: "main" },
  });

  const result = await runToCompletionWithFakeRunner({
    runDir,
    resolve(action) {
      if (action.kind === "node") {
        return { status: "ok", value: { value: action.taskDef.metadata?.value ?? 0 } };
      }
      return undefined;
    },
  });

  expect(result.status).toBe("completed");
  expect(result.executed).toHaveLength(2);
});
```

* Each fake resolution can provide `stdout`, `stderr`, timestamps, and metadata.
* If your resolver returns `undefined` for an action, the harness leaves it pending and returns `{ status: "waiting", pending: [...] }`.
* Use `maxIterations` (default `100`) to catch runaway loops, and `onIteration(result)` to inspect intermediate states.

---

## 8. Cleaning up run artifacts

All examples above write into `~/.a5c/runs/<runId>` by default. After a tutorial or test completes, remove the directory (or move it under an archive location) to keep your environment tidy:

```bash
rm -rf ~/.a5c/runs/run-20260112-130455
```

---

Need another scenario documented? Open an issue with the desired flow (CLI flags, harness behavior, etc.) and the team will extend this file. For the deeper specification refer to [`babysitter_cli_surface_spec.md`](./reference/babysitter_cli_surface_spec.md).

---

## Appendix A. Regenerating this walkthrough (deterministic workflow)

This walkthrough is anchored to the real smoke harness in `packages/sdk/scripts/smoke-cli.js` and the generated traceability index at `docs/generated/cli-examples-verification.md`. When you change CLI output, flags, or wording in this file, use the current repo workflow below from a fresh checkout:

1. **Install dependencies and build the SDK CLI.**

```bash
npm ci
npm run build --workspace=@a5c-ai/babysitter-sdk
```

2. **Regenerate repo docs artifacts, including the CLI traceability index.**

```bash
npm run docs:prepare
```

3. **Run the real CLI smoke harness.**

```bash
npm run docs:examples:smoke
```

This delegates to `npm run smoke:cli --workspace=@a5c-ai/babysitter-sdk`, which stages deterministic fixtures under `packages/sdk/test-fixtures/cli/runs/smoke/`. Add `-- --keep` to the underlying SDK command when you need to inspect the staged run directory after the smoke run finishes.

4. **Run the repo docs checks that validate published command surfaces.**

```bash
npm run docs:snippets
npm run docs:qa
```

5. **Keep the harness API docs aligned.**
   - `packages/sdk/src/testing/README.md` and `library/reference/sdk.md` should be updated in the same change when this walkthrough references `runToCompletionWithFakeRunner`, `captureRunSnapshot`, or other deterministic harness APIs.
   - Run `npm run test --workspace=@a5c-ai/babysitter-sdk` after changing those APIs or their examples.

CLI output intentionally uses POSIX-style paths even on Windows so the published examples stay stable across platforms. Task payloads remain redacted unless `BABYSITTER_ALLOW_SECRET_LOGS=1` is set for verbose JSON inspection.
