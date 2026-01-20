# Babysitter CLI & SDK Examples

This guide walks through a realistic flow that exercises the `babysitter` CLI and the new deterministic test harness exposed from `@a5c-ai/babysitter-sdk/testing`. The examples assume you are standing in the repo root (or a project that already vendored the CLI + SDK) and that `.a5c/runs` is the default runs directory.

> **Tip:** All CLI paths in this document are rendered with POSIX separators (matching the CLI output convention) even when running on Windows.

---

## 1. Create a run from a process entrypoint

```bash
babysitter run:create \
  --process-id dev/build \
  --entry processes/build/process.mjs#process \
  --inputs examples/inputs/build.json
```

Typical JSON response (`--json`):

```json
{
  "runId": "run-20260112-130455",
  "runDir": ".a5c/runs/run-20260112-130455",
  "process": {
    "processId": "dev/build",
    "entry": "processes/build/process.mjs#process"
  }
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

All examples above write into `.a5c/runs/<runId>`. After a tutorial or test completes, remove the directory (or move it under `runs/archive/`) to keep your repository tidy:

```bash
rm -rf .a5c/runs/run-20260112-130455
```

---

Need another scenario documented? Open an issue with the desired flow (CLI flags, harness behavior, etc.) and the team will extend this file. For the deeper specification refer to [`sdk.md`](../sdk.md).

---

## Appendix A. Regenerating this walkthrough (deterministic workflow)

The CLI transcripts above are **not** hand-edited—they are captured via the deterministic smoke harness described in sdk.md §10.6 and the Part 7 verification plan. When you change CLI output, flags, or doc wording that relies on real commands:

1. **Run the smoke harness for every platform/Node version you support.**

```bash
# macOS/Linux
pnpm --filter @a5c-ai/babysitter-sdk run smoke:cli \
  -- --runs-dir .a5c/runs/docs-cli \
     --record docs/cli-examples/baselines

# Windows (PowerShell wrapper)
pwsh -File scripts/docs/run_cli_examples.ps1 `
  -RunsDir .a5c/runs/docs-cli `
  -BaselineDir docs/cli-examples/baselines
```

2. **Commit the refreshed baselines + hashes.**
   - Every `*.stdout`, `*.stderr`, and `*.json` file in `docs/cli-examples/baselines/` is hashed via `sha256sum > docs/cli-examples/baselines/hashes.json`.  
   - CI uploads `_ci_artifacts/cli/<os>-node<version>/smoke-cli-report.json` so reviewers can diff outputs and metadata pairs (`stateVersion`, `pending[...]`, `journalHead`).

3. **Respect redaction and Windows guidance.**
   - CLI output intentionally prints POSIX-style paths even on Windows so docs stay stable; keep the callout near the top of this file.
   - Task payloads remain redacted unless `BABYSITTER_ALLOW_SECRET_LOGS=true` **and** `--json --verbose` are used together (see sdk.md §12.4). The smoke harness enforces this by scanning for `payloads: redacted`.

4. **Link back to the deterministic harness.**
   - When expanding examples, ensure corresponding snippets exist in `packages/sdk/src/testing/README.md` or sdk.md §§8–13 so the snippet extractor and fake-runner tests cover them.

5. **Archive run metadata.**
   - Each replay stores `_ci_artifacts/cli/run-metadata.json` with OS, Node version, git commit, and env vars so future contributors can reproduce the walkthrough exactly.

Failing to regenerate outputs will cause the docs CI jobs (`docs:lint`, `docs:snippets`, `smoke:cli`, `docs:testing-readme`) to fail once the Part 7 verification matrix runs in CI. When in doubt, run `pnpm --filter @a5c-ai/babysitter-sdk run docs:plan` locally to execute all doc checks before opening a PR.
